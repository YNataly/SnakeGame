class Timer{
    constructor(interval, updateInterval, callback, decStep, changeInterval, thisArg) {
        //thisArg - this for callback
        //callback(prevInterval, newInterval, pauseSum)
        //all time in ms

        this.interval = interval;
        this.updateInterval = updateInterval;

        this.callback = callback;
        this.thisArg = thisArg;

        this._pause = false;
        this.tm = null;

        this._stop = true;
        this.decStep = +decStep || 50;

        this.changeInterval = changeInterval || this._linear;


    }

    start() {
        this.decrement = 0;
        this._decSpeed = false;

        this.pauseCount = 0;
        this.executionInterval = -1;
        this._stop = false;;
        this._start =this.current= Date.now();
        this._oneStep();
    }

    get isStop() {
        return this._pause || this._stop;
    }

    stop() {
        this._stop = true;
        if (this.tm) {
            clearTimeout(this.tm);
            this.tm = null;
        }
    }


    _linear(interval) {
        return Math.max(interval - 10, 20);
    }

    _oneStep() {
        if (this._pause ||  this._stop) return;
        let oldInterval = this.interval;
        let pauseSum = this.pauseCount;
        let newInterval;

        this.current = Date.now();
        this.executionInterval = -1;

        if (this.current - this._start - this.pauseCount >= this.updateInterval) {
            //console.log("--->inTimer: " + (this.current - this._start - this.pauseCount) + " > " + this.updateInterval);
            this.pauseCount = 0;
            this._start = this.current;

            newInterval = Math.max(this.interval - this.decrement, 0);
            this.interval=Math.max(this.changeInterval.call(this.thisArg, this.interval), 0);
            newInterval = Math.min(newInterval, this.interval);

            if (this._decSpeed && this.decrement > 0) {
                if (newInterval > 200)
                    this.decrement = Math.max(this.decrement - Math.round(newInterval / 200 * this.decStep), 0);
                else this.decrement = Math.max(this.decrement - this.decStep, 0);

                if (!this.decrement)
                    this._decSpeed = false;
            }
        }
        else if (this.decrement) {
            newInterval = Math.max(this.interval - this.decrement, 0);

            if (this._decSpeed && this.decrement > 0) {
                if (newInterval > 200)
                    this.decrement = Math.max(this.decrement - Math.round(newInterval / 200 * this.decStep), 0);
                else this.decrement = Math.max(this.decrement - this.decStep, 0);


                if (!this.decrement)
                    this._decSpeed = false;
            }
        }
        else { newInterval = this.interval; }

       
          this.callback.call(this.thisArg,  newInterval);

          //console.log("setTimeout: newInterval=" + newInterval + " interval=" + this.interval + " dec=" + this.decrement + " , _decSpeed=" + this._decSpeed);
        this.tm = setTimeout(() =>  this._oneStep(), newInterval);
    }

    decSpeed() {
        this._decSpeed = true;
    }

    incSpeed() {
        if (this.isStop) return;

        if (this._decSpeed)
            this._decSpeed = false;

        let newDec = this.decrement + this.decStep;
        if (newDec<this.interval)
           this.decrement= newDec;
        //console.log("Up: newInterval=" + (this.interval - this.decrement));
    }

   get isPause() {
        return this._pause;
    }

    pause() {
        if(this.isStop) return;

        this._pause = true;
        if (this.tm) {
            clearTimeout(this.tm);
            this.tm = null;
        }

        this.pauseStart = Date.now();
     //   console.log("\tpause: pauseTime=" + this.pauseCount +" , executionInterval=" + this.executionInterval+ " , interval=" + this.interval);
    }

    resume() {
        //console.log("resume: this._pause=" + this._pause);
        if (this._stop) return;

        if (!this._pause) return;
        this.pauseCount+=(Date.now() - this.pauseStart);
        this._pause = false;

        if (this.executionInterval < 0)
            this.executionInterval = Math.max(this.interval - (this.pauseStart - this.current),0);
        else this.executionInterval = Math.max(this.executionInterval - (this.pauseStart - this.current));

       // console.log("\tresume: pauseTime=" + this.pauseCount + " , executionInterval=" + this.executionInterval + " , interval=" + this.interval);


        this.current = Date.now();
        this.tm = setTimeout(() => {
          //  this.callback.call(this.thisArg, this.executionInterval, this.executionInterval, this.pauseCount);
            this._oneStep();
        }, this.executionInterval);

    }

}