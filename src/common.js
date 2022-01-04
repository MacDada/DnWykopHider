'use strict';

const injectStyleString = function (str) {
    const node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
};

const HidablesStorage = function (storageDriver, prefix, gcDays) {
    const countKey = "_" + prefix + "_count";

    this.has = function (id) {
        if (!id) {
            return false;
        }

        return storageDriver[prefix + id] ? true : false;
    };

    this.add = function (id) {
        if (!id) {
            return false;
        }

        if (!this.has(id)) {
            storageDriver[countKey]++;
        }

        storageDriver[prefix + id] = (new Date()).toJSON();

        return true;
    };

    this.remove = function (id) {
        if (!id) {
            return false;
        }

        if (this.has(id)) {
            storageDriver.removeItem(prefix + id);
            storageDriver[countKey]--;

            return true;
        }

        return false;
    };

    this.removeOlderThan = function (date) {
        console.log('dnwh removeOlderThan', date);

        const beforeCount = storageDriver[countKey];

        // deleting all storage hidables that are older then "date" arg.
        // takes only dnth keys into account (filters thx to the prefix)
        for (let key in storageDriver) {
            if (0 === key.indexOf(prefix)     // has the prefix
                && new Date(storageDriver[key]) < date // is old enough
            ) {
                console.log("dnwh removing ", key);

                storageDriver.removeItem(key);
                storageDriver[countKey]--;
            }
        }

        return beforeCount - storageDriver[countKey];
    };

    this.count = function () {
        return parseInt(storageDriver[countKey]);
    };

    this.clear = function () {
        return this.removeOlderThan(new Date());
    };

    // init count
    if (!storageDriver[countKey]) {
        storageDriver[countKey] = 0;
    }

    // gc: automatically delete old hidables
    (function (storage) {
        const date = new Date();
        date.setDate(date.getDate() - gcDays);

        console.log('dnwh gc: removed '
            + storage.removeOlderThan(date)
            + ' hidables older than '
            + date
        );
    })(this);
}; // eo Storage