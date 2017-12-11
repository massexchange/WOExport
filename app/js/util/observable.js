define(["Rx"], function(Rx) {
    const observableUtil = {};

    observableUtil.onlyWhen = (state$, observable) =>
        state$.switchMap(enabled =>
            enabled
                ? observable
                : Rx.Observable.never());

    return observableUtil;
});
