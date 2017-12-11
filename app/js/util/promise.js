define(["jquery"], function($) {
    const promiseUtil = {};

    promiseUtil.defer = () => {
        var resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { resolve, reject, promise };
    };

    promiseUtil.resolved = () =>
        Promise.resolve();

    return promiseUtil;
});
