define(["moment", "app/module", "app/dal", "Rx"],
function(moment, Module, dal, Rx) {
    const format = epochSecond =>
        moment.unix(epochSecond)
            .format("M/D/YYYY H:mm:ss");

    return class Clock extends Module {
        constructor() {
            super();

            this.createProperty("currentTime");
            this.model.map(format)
                .subscribe(this.currentTime);

            //every second,
            const clockTick = Rx.Observable.interval(1000)
                //grab the current time
                .withLatestFrom(this.model, (i, time) => time)
                //and increment it
                .map(time => ++time);

            //immediately, and then every 5 mins,
            const backendClockSync = Rx.Observable.timer(0, 300000)
                .flatMap(() =>
                    //sync with backend clock
                    dal.get("admin/clock"))
                .map(({ epochSecond }) => epochSecond);

            //when either of these sources updates
            //set the current time
            this.options.modelSource = Rx.Observable.merge(
                clockTick,
                backendClockSync);
        }
        set unixTime(newTime) {
            this.model.next(newTime);
        }
    };
});
