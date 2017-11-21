define(["jquery", "app/util", "app/dal", "app/viewManager", "app/table", "app/hub", "app/router", "app/noty", "app/renderer"],
function($, util, dal, ViewManager, Table, hub, Router, Noty, Renderer) {
    return class SettingManager {
        constructor(isGlobal = false) {
            this.dalRoot = `settings/${isGlobal ? "global/" : ""}`;
            this.promises = {};
            this.elements = {};
            this.isGlobal = isGlobal;
            this.columnsObject = [
                {
                    name: "Name",
                    accessor: (setting) => setting.setting.name,
                    type: "string"
                },
                {
                    name: isGlobal ? "Default Value" : "Value",
                    accessor: () => "",
                    type: "string"
                }
            ];
            if(isGlobal) {
                this.columnsObject.push({
                    name: "Overridable",
                    accessor: () => {return {id: "enableBox"};},
                    type: "checkbox"
                });

                this.columnsObject.push({
                    name: "MP Roles",
                    accessor: () => {return " ";},
                    type: "mpRoleSubTable"
                });
            }

            this.strings = {};
            this.strings.saveSuccess = MX.strings.get("settingManager_saveSuccess");
            this.strings.noSettings = MX.strings.get("settingManager_noSettings");
        }

        generateCheckBoxHandler(me, model, valueCheckBox) {
            return function() {
                if(model.mpOverridable && !me.isGlobal)
                    model = me.createNewMPSetting(model);
                me.settings.forEach(setting => {
                    if(setting.setting == model.setting)
                        setting.settingValue.value = valueCheckBox.prop("checked");
                });
            };
        }

        generateNumberHandler(me, model, valueNumber) {
            return function() {
                if(model.mpOverridable && !me.isGlobal)
                    model = me.createNewMPSetting(model);
                me.settings.forEach(setting => {
                    if(setting.setting == model.setting)
                        setting.settingValue.value = parseInt(valueNumber.val());
                });
            };
        }

        detectValueField(me, el, model) {
            var valueField = $(el.parent().find("td")[1]);
            if(model.setting.type == "booleanSetting") {
                valueField.append($("<input type='checkbox'/>").addClass("checkbox value"));
                var valueCheckBox = el.find(".value");
                valueCheckBox.prop("checked", model.settingValue.value);
                valueCheckBox.change(me.generateCheckBoxHandler(me, model, valueCheckBox));
            }
            if(model.setting.type == "intSetting") {
                valueField.append($("<input type='number' step='1'/>").addClass("checkbox value"));
                var valueNumber = el.find(".value");
                valueNumber.val(model.settingValue.value);

                valueNumber.blur(() => {
                    var currentVal = valueNumber.val();
                    currentVal = currentVal < 0
                        ? -currentVal
                        : (currentVal > 0
                            ? currentVal
                            : 1);
                    valueNumber.val(currentVal);
                });

                valueNumber.change(me.generateNumberHandler(me, model, valueNumber));
            }
        }

        generateTableFunc() {
            var me = this;
            return async function(el, model) {
                me.detectValueField(me, el, model);

                if(!me.isGlobal)
                    return;
                const enableCheckBox = el.find("#enableBox");
                enableCheckBox.prop("checked", model.mpOverridable);
                enableCheckBox.change(() => model.mpOverridable = enableCheckBox.prop("checked"));

                //mp roles
                const rolesRenderer = new Renderer(el.find("#mpRoleContainer"));
                const isAdv = model.setting.roles.includes("ADVERTISER");
                const isPub = model.setting.roles.includes("PUBLISHER");

                const rolesEl = await rolesRenderer.render("settingsMPRolesTable", {
                    adv: isAdv,
                    pub: isPub
                });

                const advCb = rolesEl.find("[name=advertiser]");
                const pubCb = rolesEl.find("[name=publisher]");

                const roleCbClickHandler = function(cb, roleName) {
                    if($(cb).is(":checked"))
                        model.setting.roles.push(roleName);
                    else
                        model.setting.roles = model.setting.roles
                            .filter(role => role != roleName);
                };
                advCb.click(function() { roleCbClickHandler(this, "ADVERTISER"); });
                pubCb.click(function() { roleCbClickHandler(this, "PUBLISHER"); });
            };
        }

        createNewMPSetting(global) {
            const newMPSetting = {
                id: null,
                setting: global.setting,
                settingValue: {id: null, value: global.value}
            };
            this.settings = this.settings.filter(setting => setting != global);
            this.settings.push(newMPSetting);
            return newMPSetting;
        }

        async saveHandler() {
            Noty.closeAll();

            var savePs = this.settings.map(async setting => {
                var possibleAction = null;

                if(this.isGlobal)
                    possibleAction = dal.put(`${this.dalRoot}${setting.id}`, setting);

                if((util.isNull(setting.mpOverridable) || !util.isDefined(setting.mpOverridable))
                 && !this.isGlobal)
                    possibleAction = (setting.id
                        ? dal.put(`${this.dalRoot}${setting.id}`, setting)
                        : dal.post(this.dalRoot, setting));

                if(util.isNull(possibleAction))
                    return null;

                const resp = await possibleAction;
                setting.id = resp.id;
                setting.settingId = resp.settingId;
                setting.settingValue = resp.settingValue;
            });

            await Promise.all(savePs);
            Noty.success(this.strings.saveSuccess);
        }

        init() {
            this.promises.settingsP = dal.get(this.dalRoot);

            if(!this.isGlobal)
                this.promises.settingsP = this.promises.settingsP
                    .then(mps => Promise.all([
                        dal.get("settings/global/default"),
                        mps]))
                    .then(([globs, mps]) => {
                        const usedSettings = mps.reduce((acc, val) => {
                            acc[val.setting.name] = true;
                            return acc;
                        }, {});

                        return [
                            ...mps,
                            ...globs.filter(glob =>
                                !usedSettings[glob.setting.name])
                        ];
                    });

            return Promise.all([this.promises.settingsP]);
        }

        async render() {
            const [el, settings] = await Promise.all([
                ViewManager.renderView("settingManager"),
                this.promises.settingsP]);

            this.settings = settings;
            this.elements.table = $("#table");
            this.elements.saveButton = $("#saveButton");

            if(settings.length != 0) {
                this.table = new Table(this.elements.table, this.settings, this.columnsObject, false);
                this.table.render(this.generateTableFunc());
            } else
                this.elements.table.text(this.strings.noSettings);

            this.elements.saveButton.click(() =>
                this.saveHandler());

            if(!this.isGlobal)
                $("#title > h1").text("Settings");
        }
    };
});
