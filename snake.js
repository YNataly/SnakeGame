'use strict'
//const TOP="top", BOTTOM="bottom", LEFT="left", RIGHT="right";

class Game {
    constructor({walls, targets, fieldWidth=30, fieldHeight=30, unitSize=20, snake:snake={}}={}){
        //round
        this.roundsNumber=Game.Snake.length || 1;
        this.round=0;
        this.roundStartInterval=800; //ms

        this.leftBtn=document.getElementById("leftBtn");
        this.rightBtn=document.getElementById("rightBtn");
        this.pauseBtn=document.getElementById("pauseBtn");
        this.incSpeedBtn=document.getElementById("incSpeedBtn");

        this.controls=document.getElementById("controls");
        this.cont=document.getElementById("cont");
        this.contBtn=document.getElementById("contBtn");

        this.keyLeftObj={code:'ArrowLeft'};
        this.keyRightObj={code:'ArrowRight'};
        this.keyUpObj={code:'ArrowUp'};

        this.pauseObj={code:"KeyP"};
        this.enterObj={code:"Enter"};

       
        this.speedKey={isPressed: false, tm: null, ti: null};
       
        this.keyDownHandler=this._onKeyDown.bind(this);
        this.EnterKeyHandler=this._onEnter.bind(this);
        
        this.longPressHandler=this._onPress.bind(this);
        this.longPressUpHandler=this._onUp.bind(this);

        this.createGame({walls, targets, fieldWidth, fieldHeight, unitSize, snake});
        this.setBtnHandlers();
        
        this.setStartHandler();
    }

    createGame({walls, targets, fieldWidth=30, fieldHeight=30, unitSize=20, snake:snake={}}={}) {
        this.pauseBtn.classList.remove("on");
        this.controls.hidden=false;

        this.interval=this.roundStartInterval; //ms
      
        if (!walls) { walls = [[10, 10], [11, 11], [10, 11], [11, 10]];
            walls.push([25, 20], [26, 20], [19, 19]);}

        if (!targets) {targets = [[27, 15], [15, 22],[15,13], [20, 22]];}
        
        this.snake =new Snake(snake);
    
        //{  head: [15, 15], length: 3,  dir: TOP, snakeDivs: [], snakeCoords: [], snakeCoordsSet: new Set(), state: { boom: false, eat: false, canTurn:true }};

        this.field=new Field({size: {X:fieldWidth, Y:fieldHeight}, walls, targets, unitSize});
        this.field.drawField();
        this.snake.initSnake(this.field,  this.interval);

        this.snake.updateAnimationSpeed(this.interval);

        this.incSpeedTime=1000*60;//1 min
        this.intervalUpdated=false;
        
        //interval, updateInterval, callback, decStep, changeInterval, thisArg
        this.timer=new Timer(this.roundStartInterval, this.incSpeedTime, this._gameStep, 25, this.updateSpeedInterval, this);

        document.addEventListener("keydown", this.keyDownHandler);
       
    }


    setStartHandler(){
        this.runGame=this.startGame;
        document.addEventListener("keydown", this.EnterKeyHandler);
        document.getElementById("startBtn").onclick=()=> this._onEnter(this.enterObj);
    }

    startGame() {
       this.runGame=this.restartGame;
       document.getElementById("coverDiv").remove();
       this.start();
    }

    restartGame(){
        this.cont.classList.add("hide");
        this.restart();
    }

    setBtnHandlers() {
        this.leftBtn.onclick=()=> this._onKeyDown(this.keyLeftObj);
        this.rightBtn.onclick=()=> this._onKeyDown(this.keyRightObj);
        this.pauseBtn.onclick=()=> this._onKeyDown(this.pauseObj);
        this.incSpeedBtn.addEventListener("mousedown",this.longPressHandler);
        this.incSpeedBtn.addEventListener("touchstart",this.longPressHandler);

    }

  

    static getWalls(ind) {
        return Game.Walls[ind];
    }

    static getFood(ind) {
        return Game.Food[ind];
    }

    static getSnake(ind) {
        return Game.Snake[ind];
    }


    static createWalls(coords){
        //coords [[x,y,length, 'h/v']]
        let w=[];
        let i, j, len;
        for (let el of coords) {
            len=el[2];
            if(el[3]==="h"){
                for(i=el[0], j=el[1];len>0; i++, len--)
                    w.push([i,j]);
            }
            else if(el[3]==="v"){
                for(i=el[0], j=el[1];len>0; j++, len--)
                    w.push([i,j]);
            }
        }

        return w;
    }


    restart() {
        this.field.removeField();
        this.createGame({fieldWidth:this.field.fieldSize.width, fieldHeight:this.field.fieldSize.height, unitSize:this.field.unit,
            walls: Game.createWalls(Game.getWalls(this.round)), targets: Game.getFood(this.round), snake: Game.getSnake(this.round)});
        this.start();
    }

    start() {
       setTimeout(()=> this.timer.start(), 250);
    }

    updateSpeedInterval(interval) 
    {
        if (interval > 600)
            interval -= 50;
        else if (interval > 250)
            interval -= 40;

        if (interval <= 250) {
            interval = 250;
        }
        return interval;
    }
    
     


    _onPress(event) {

        if(this.timer.isStop) return;
        // this.speedKey={isPressed: false, tm: null, ti: null};
       // console.log("_onPress: "+event.type+" , isKeyPressed="+this.speedKey.isPressed );

        if( this.speedKey.isPressed) return;
        this.speedKey.isPressed=true;

        switch (event.type) {
            case "mousedown": this.speedKey.eventType="mouseup";  
                this.incSpeedBtn.addEventListener("mouseup",this.longPressUpHandler);
                              break;
            case "touchstart": this.speedKey.eventType="touchend";
                this.incSpeedBtn.addEventListener("touchend",this.longPressUpHandler);
                               break;
            case "keydown": this.speedKey.eventType="keyup";
                document.addEventListener("keyup", this.longPressUpHandler);
                event.preventDefault();
                            break;
            default: return;
        }

        
        
        this.speedKey.tm=setTimeout(()=>{
            this.timer.incSpeed();
            this.speedKey.tm=null;
            this.speedKey.ti=setInterval(()=>this.timer.incSpeed(), 200);
           },150);
      
    }


    _onUp(event) {
      //  console.log("_onUp: isKeyPressed= "+this.speedKey.isPressed+" eventType="+(!event? "" : event.type)+" , KeyEventType="+this.speedKey.eventType);
        if(!this.speedKey.isPressed) return;


        if(!event || event.type===this.speedKey.eventType){
            //remove eventListener
            switch(this.speedKey.eventType){
                case "mouseup":this.incSpeedBtn.removeEventListener("mouseup",this.longPressUpHandler);
                    break;
                case "touchend":
                    this.incSpeedBtn.removeEventListener("touchend",this.longPressUpHandler);
                    break;
                case "keyup": 
                    if(event && event.code!=="ArrowUp") return;
                     document.removeEventListener("keyup", this.longPressUpHandler);
                    break;
            }
           
            this.timer.decSpeed();

            this.speedKey.eventType=null;

            if(this.speedKey.tm){
                clearTimeout(this.speedKey.tm);
                this.speedKey.tm=null;
            }
            else if (this.speedKey.ti){
                clearInterval(this.speedKey.ti);
                this.speedKey.ti=null;
            }
            this.speedKey.isPressed=false;
        }
    }


    _onKeyDown(event) {
       
        if (event.code === "KeyP") { 
            if (event.preventDefault) 
                event.preventDefault();

            if (this.timer.isPause)
                this.timer.resume();
            else this.timer.pause();

            if(this.timer.isPause) this.pauseBtn.classList.add("on");
            else this.pauseBtn.classList.remove("on");
            return;}
        
        if (this.timer.isPause) return;

        if (event.code === "ArrowUp") { this._onPress(event); return;}

        if (!this.snake.canTurn) return;

        if (event.code === 'ArrowRight' || event.code === 'Numpad6')
        { if (event.preventDefault) 
            event.preventDefault();
        
           this.snake.canTurn = false; this.snake.turnRight(); }
        
        else if (event.code === 'ArrowLeft' || event.code === 'Numpad4')
        { if (event.preventDefault) 
              event.preventDefault();
        
         this.snake.canTurn = false; this.snake.turnLeft(); }
       
    }


    _onEnter(event) {
        if (event.code==='Enter') {
            document.removeEventListener("keydown", this.EnterKeyHandler);
            this.runGame();
        }
    }
   
    _gameStep(interval){
        if (this.timer.isStop) return;
        
        if (this.interval!==interval) {
            this.intervalUpdated=true;
            this.interval= interval;
        }
        else 
            this.intervalUpdated=false;

        if (this.field.targetsCount == 0) { this.gameOver(true); return; }
       
        this.snake.turnHead();
        this.snake.turnTail();

        this.snake.moveOne();
        
        this.field.checkObstacles(this.snake);
        if (this.snake.state.boom) { this.gameOver(false); return; }

        if (this.intervalUpdated) 
            this.snake.updateAnimationSpeed(this.interval);


        if (this.snake.state.eat) {
            this.snake.growSnake(this.interval);
            this.snake.state.eat = false;
            
        }
        else {
            this.snake.updateSnakeCoords();
        }
       
        this.snake.drawSnake();
        this.snake.canTurn = true;
    }


    gameOver(isSuccess) {
        this.timer.stop();

        this.controls.hidden=true;
        document.removeEventListener("keydown", this.keyDownHandler);
       
        this._onUp(); //remove inc speed if exists

        this.field.showGameFinishedMsg(isSuccess, this.round+1,this.roundsNumber );
        if (isSuccess) {
            this.round++;
            if(this.round===this.roundsNumber) { //saveYourName
                return;}
            
            if (this.roundStartInterval>=600) this.roundStartInterval-=30;} 

        document.addEventListener("keydown", this.EnterKeyHandler);
        this.cont.classList.remove("hide");
        this.contBtn.onclick=()=> this._onEnter(this.enterObj);
    } 


}

//=====================================================


class Snake {
    constructor({head: [headX=15, headY=15] = [], length=3, dir}={}) {
        this.head=[headX, headY];
        this.length=length<3? 3: length;
       
        switch (dir) {
            case "left": 
            case "right": 
            case "top": 
            case "bottom": this.dir = dir; break;
            default: this.dir="top";
        }

        this.snakeDivs= [];
        this.snakeCoords= [];
        this.snakeCoordsSet= new Set();
        this.state= { boom: false, eat: false};
        this.canTurn=true;
        
    }


    initSnake(field, gameInterval=0) {
        let x = 0, y = 0;
        let coords;

        if(!(field instanceof Field)) throw new Error("parameter field must be instanceof Field. field="+field);
        this.gameField=field;

        switch (this.dir) {
            case "left": x =  1; break;
            case "right": x=- 1; break;
            case "top": y = 1; break;
            case "bottom": y = - 1; break;
        }
        for (let i = this.length - 1; i >= 0 ; i--) {
            coords = [this.head[0] + i * x, this.head[1] + i * y];
        
            this.snakeCoords.push(coords);
            this.snakeCoordsSet.add(coords.toString());

            let d = this.gameField.createDiv(coords);
            d.style.transitionDuration=gameInterval+"ms";
            this.snakeDivs.push(d);
            d.className = "snake ";
            
        }
        this.snakeDivs[this.length - 1].dataset.direction = this.dir;
        this.snakeDivs[this.length - 1].classList.add("snake-head");

        if (this.length > 1) {
            this.snakeDivs[0].classList.add("snake-tail");
            this.snakeDivs[0].dataset.direction = this.dir;
        }
    }


    turnHead() {
        let el = this.snakeDivs[this.length - 1];
        if (this.dir !== el.dataset.direction)
            el.dataset.direction = this.dir;   //turnHead
    }

    turnTail() {
        if (this.length > 1)
            this.setDirection(this.snakeDivs[0], this.snakeCoords[0], this.snakeCoords[1]);
    }

    
    turnRight() {
        switch (this.dir) {
            case "left": this.dir="top"; break;
            case "right": this.dir="bottom"; break;
            case "top": this.dir="right"; break;
            case "bottom": this.dir = "left"; break;
        }
    }

    turnLeft() {
        switch (this.dir) {
            case "left": this.dir = "bottom"; break;
            case "right": this.dir = "top"; break;
            case "top": this.dir = "left"; break;
            case "bottom": this.dir = "right"; break;
        }
    }



    growSnake(gameInterval=0) {
        let el = this.gameField.createDiv(this.snakeCoords[this.length - 2]);
        el.style.transitionDuration=gameInterval+"ms";
        el.className = "snake";
   
        this.snakeDivs.splice(1,0,el);
        this.length++;
       
        this.snakeCoords.push(this.head.slice());
        this.snakeCoordsSet.add(this.head.toString());
        let delay=gameInterval>5? gameInterval-gameInterval/5 : 0;
   
        setTimeout((key => () => this.gameField.removeFood(key))(this.head.toString()), delay);
    }


    
    updateSnakeCoords() {
        this.snakeCoordsSet.delete(this.snakeCoords[0].toString());
        this.snakeCoords.shift();

        this.snakeCoords.push(this.head.slice());
        this.snakeCoordsSet.add(this.head.toString());
    }



    drawSnake() {
        let el, ind;
        let i;
        for (i=0; i < this.length; i++) {
            el = this.snakeDivs[i];
            el.style.left = this.snakeCoords[i][0]* this.gameField.unit + "px";
            el.style.top = this.snakeCoords[i][1] * this.gameField.unit + "px";
        }
    }


   setDirection(el, elCoords, prevCoords) {
        let dirv = elCoords[1] - prevCoords[1];
        let dirh = elCoords[0] - prevCoords[0];
        let dir;
        if (dirv < 0) { if (el.dataset.direction != "bottom") el.dataset.direction = "bottom"; }
        else if (dirv > 0) { if (el.dataset.direction != "top") el.dataset.direction = "top"; }
        else if (dirh < 0) { if (el.dataset.direction != "right") el.dataset.direction = "right"; }
        else if (dirh > 0) { if (el.dataset.direction != "left") el.dataset.direction = "left"; }
    }



     moveOne() {
         switch (this.dir) {
             case "right": this.head[0]++; break;
             case "left": this.head[0]--; break;
             case "top": this.head[1]--; break;
             case "bottom": this.head[1]++; break;
        }
     }


     updateAnimationSpeed(newInterval) {
         for (let div of this.snakeDivs){
             div.style.transitionDuration=newInterval+"ms";
         }
     }
   
}



//=======================================================================
class Field  {
    constructor({size: {X=30, Y=30}={}, walls=[], targets=[], unit=20}={}) {
        this.fieldSize = { width: X, height: Y };
        
        this.Obstacles = new Set(walls.filter(coords=>this._withinField(coords)).map(el => el.toString()));
        this.Food=new Map();

        for (let t of targets.filter(coords=>this._withinField(coords) && !this.Obstacles.has(coords.toString()))) {
               this.Food.set(t.toString(), null);
        }

        this.targetsCount = this.Food.size;
        this.unit=unit;

    }


    drawField() {
        this.field = document.getElementById("field");
        field.style.width = this.unit * this.fieldSize.width + "px";
        field.style.height = this.unit * this.fieldSize.height + "px";


        this.Obstacles.forEach(coords =>
               this.createDiv(coords.split(",").map(str => +str)).className = "wall");
       

         let div;
         for (let coords of this.Food.keys()) {
            div = this.createDiv(coords.split(",").map(str => +str));
            div.className = "food";
            this.Food.set(coords, div);
        }

    }


    _withinField(coords) {
        return (coords[0]>=0 && coords[0]<this.fieldSize.width  && coords[1]>=0 && coords[1]<this.fieldSize.height);
    }


    removeField() {
        this.field.innerHTML="";
    }

    createDiv(w) {
         let div = document.createElement("div");

         div.style.height = this.unit + "px";
         div.style.width = this.unit + "px";
         div.style.left = w[0] * this.unit + "px";
         div.style.top = w[1] * this.unit + "px";

         this.field.append(div);
         return div;
     }

     removeFood(foodKey) {
         this.Food.get(foodKey).remove(); //remove from DOM
         this.Food.delete(foodKey);
         this.targetsCount--;
     }



     checkObstacles(snake) {
         let headKey = snake.head.toString();
         if (this.Obstacles.has(headKey) || snake.snakeCoordsSet.has(headKey) || snake.head[0] < 0 || snake.head[1] < 0 || snake.head[0] === this.fieldSize.width || snake.head[1] === this.fieldSize.height)
         {
             snake.state.boom = true;
             snake.state.eat = false;
        
         }
         else if (this.Food.has(headKey))
         {
             snake.state.eat = true;
       
         }

         else {snake.state.eat = false;}
     }

     showGameFinishedMsg(isSuccess, finishedRound, roundsNumber){
         let span = document.createElement("span");
         if (isSuccess) {
             if(finishedRound===roundsNumber){
                 span.className = "win";
                 span.innerHTML = "<span>Congratulations!</span><span style='display:inline-block;'>You're WIN!</span>";}
             else {
                 span.className = "round-completed";
                 span.innerHTML ="Round " + finishedRound + " completed!";
             }
         }
         else {
             span.className = "fail";
             span.innerHTML = "You're Failed";
         }
         this.field.appendChild(span);
     }


}

//===========================================================
//  [coordX, coordY, length, 'v'],  'v'-vertical, 'h'-horizontal. coordX, coordY >= 0; length >= 1.
//  Game.Walls - each element  [[2, 2, 3, 'h'], [2, 3, 4, 'v'],...] -walls for one game
// Game.Food, Game.Snake - same as Game.Walls
// new Game({fieldWidth:20, fieldHeight:20,...}) - fieldWidth, fieldHeight - field size 
// Snake coords must be into field (0 to 19  if fieldWidth:20, fieldHeight:20) and not same as some wall/food coords in current game
// Wall and Food coords outside of field will be ignored
Game.Walls=[
    [[2, 2, 3, 'h'], [2, 3, 4, 'v'], [12, 5, 5, 'h'], [3,17,4,'h'], [4,18,3, 'v'], [16,14,4,'h'], [16,15,2,'v']],
	 [[2,2,3,'h'],[4,3,2,'v'],[1,7,5,'v'],[4,7,5,'v'],[2,7,2,'h'],[2,11,2,'h'],[4,15,5,'v'],[10,17,2,'v'],[9,9,11,'h'],[14,13,2,'h'],[114,14,2,'h'],
        [14,15,2,'h'],[17,3,3,'h']],
    [[0, 0, 2, 'h'], [18, 0, 2, 'h'], [0, 1, 2, 'v'], [19, 1, 2, 'v'], [6, 2, 7, 'v'], [3, 4, 9, 'h'], [13, 4, 4, 'h'], [15, 4, 10, 'v'], [13, 8, 4, 'h'], [6, 10, 10, 'v'], [5,12,4,'h'], [5,17,3,'h'], [0,17,3,'v'], [1,19,1,'h'], [15,15,3,'v'], [13,16,3,'v'], [11,17,4,'h'], [19,17,3,'v'], [18,19,1,'h']],
  [[2,3,4,'h'],[2,7,5,'h'],[2,12,5,'h'],[9,7,8,'h'],[7,16,2,'h'],[7,17,2,'h'],[13,18,5,'h'],[13,12,5,'h'],[13,2,4,'h'],[2,8,3,'v'],[9,2,5,'v'],
        [13, 13, 5, 'v'], [16, 13, 2, 'h'], [16, 3, 4, 'v']],
 [[0, 0, 5, 'h'], [10, 1, 9, 'h'], [1, 3, 8, 'h'], [1, 4, 1, 'h'], [10, 3, 4, '4'], [13, 4, 4, 'v'], [18, 4, 1, 'h'], [17, 4, 2, 'v'], [16, 4, 8, 'v'], [17, 11, 1, 'h'], [18, 11, 3, 'v'], [18, 15, 3, 'v'], [15, 15, 2, 'v'], [13, 14, 2, 'v'], [13, 18, 4, 'h'], [4, 5, 8, 'h'], [1,6,4,'v'], [4,6,7,'v'], [11,6,4,'v'], [7,9,4,'h'], [5,12,2,'h'], [13,9,2,'v'], [8,11,6,'h'], [8,12,6,'h'], [1,12,3,'v'], [1,16,3,'v'], [5,14,2,'h'], [8,14,3,'h'], [11,14,5,'v'], [5,16,3,'v'], [6,16,3,'h'], [5,19,7,'h']]
    ];
Game.Food=[
    [[10, 10], [14, 3], [5, 7], [3, 15], [18, 18]],
	   [[0,14],[19,0],[14,10],[18,14],[3,3],[11,1],[12,19]],
    [[4,2], [9,2], [16,1], [19,4], [13,6], [8,7], [4,8], [18,10], [1,11], [13,11], [8,14], [4,15], [18,15], [12,19]],
  [[7, 1], [3, 5], [14, 5], [3, 17], [8, 18], [14, 5], [15, 15], [0, 0], [10, 6]],
    [[0,1], [6,1], [11,0], [13,2], [19,2], [2,4], [5,14], [0,7], [6,6],  [10,6],  [10,8], [17,8], [3,10], [0,16], [19,13], [10,15], [13,16], [17,16], [19,19], [2,18]]
];
Game.Snake=[
             {head:[9,13], length:4,dir:"top"},
			 {head:[10,12], length:3,dir:"top"},
            {head:[10,14], length:3,dir:"top"},
          { head: [10, 12], length: 3, dir: "top" },
            { head: [10, 13], length: 3, dir: "left" }
];

//createWalls(coords)  //coords [[x,y,length, 'h/v']]

//constructor({walls, targets, fieldWidth=30, fieldHeight=30, unitSize=20, snake:snake={}}={}){
let game=new Game({fieldWidth:20, fieldHeight:20, walls: Game.createWalls(Game.getWalls(0)), targets: Game.getFood(0), snake: Game.getSnake(0)});


    

     

       

   


       

       



        

       

       


