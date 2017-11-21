define(["app/util", "app/renderer", "app/dal", "app/dropdown", "app/list", "app/catalogGroup", "app/noty"],
function(util, Renderer, dal, Dropdown, List, CatalogGroup, Noty) {
    return function(candidateRecordList) {
        // var exports = {
        //     candidates: candidateRecordList
        // };
        // var internals = {
        //     catalogGroupControls: []
        // };
        //
        // var mpsDropdownText = MX.strings.geT("networkDialog_mpsDropdown");
        // var marketClosed = MX.strings.get("marketClosed");
        // var ordersSubmitted = MX.strings.get("networkDialog_ordersSubmitted");
        // var yesText = MX.strings.get("networkDialog_yesText");
        //
        // //TODO: reconcile the structural differences between what this file expects
        // //and what the sellDialog expects, and possibly move some of these functions
        // //to util.js
        //
        // //useful function
        // var categoryComparator = function(attrA, attrB) {
        //     return (attrA.type.category < attrB.type.category) ? -1 :
        //         (attrA.type.category > attrB.type.category) ? 1 : 0;
        // };
        //
        // //useful function
        // var shardEq = function(shardA, shardB) {
        //     if(shardA.length != shardB.length)
        //         return false;
        //     else {
        //         //numerical comparison function
        //         var numerical = function(a, b) {
        //             return (a < b) ? -1 :
        //             (a > b) ? 1 : 0;
        //         };
        //         //make sure the attrId sets of each are the same
        //         var idA = shardA.map(el => el.id).sort(numerical);
        //         var idB = shardB.map(el => el.id).sort(numerical);
        //         for(var i = 0; i < idA.length; i++) {
        //             if(idA[i] != idB[i]) return false;
        //         }
        //         return true;
        //     }
        // };
        //
        // var recoverGroups = function(collRecList) {
        //     var result = [];
        //     collRecList.forEach(function(coll) {
        //         //first recover the shard
        //         var shard = util.getVisibleAttributes(coll.catRecs[0].shard).sort(categoryComparator);
        //         //find if this collrec belongs in a group by comparing shards
        //         for(var i = 0; i < result.length; i++) {
        //             if(shardEq(result[i].shard, shard)) {
        //                 //if it does, tack this one onto it's collrec list, and continue
        //                 result[i].collapsedRecs.push(coll);
        //                 return;
        //             }
        //         }
        //         //otherwise construct the new group and tack it onto the result
        //         var group = {
        //             shard: shard,
        //             collapsedRecs: [coll]
        //         };
        //         result.push(group);
        //     });
        //     return result;
        // };
        //
        // var getConstructor = function() {
        //     return function(html, group) {
        //         var group = CatalogGroup(html, group, util.noop, {type: "network"});
        //         internals.catalogGroupControls.push(group);
        //         return group;
        //     };
        // };
        //
        // var initGroupList = function() {
        //     exports.networkFinalizer = new List($("#networkFinalizerDiv"), exports.regrouped, getConstructor());
        //     exports.networkFinalizer.render();
        // };
        //
        // var init = function() {
        //     //recover catalog group structure
        //     exports.regrouped = recoverGroups(exports.candidates);
        //     //grab all publishers, filter out the user
        //     dal.get("mp", {role: "PUBLISHER"}).then(function(list) {
        //         var mpList = list.filter(function(x) {
        //             return x.id != MX.session.creds.user.mp.id;
        //         });
        //         exports.mpDropdown = new Dropdown(mpList, {
        //             container: $("#pubDropdownDiv"),
        //             promptText: mpsDropdownText,
        //             textField: "name",
        //             valField: "id",
        //             enableDefault: false
        //         });
        //
        //         exports.mpDropdown.render().then(function() {
        //             initGroupList();
        //             //change handler for the network price field
        //             $("#apply").click(function() {
        //                 var newPrice = $("#networkPrice").val();
        //                 var inputArr = $('input.priceInput[type=number]');
        //                 for(var i = 0; i < inputArr.length; i++)
        //                     $(inputArr[i]).val(newPrice);
        //             });
        //         });
        //     });
        //
        //     //also warn if it is closed
        //     dal.get("market/status").then((state) => {
        //         if(!state.open) {
        //             $(".vex-dialog-message").empty();
        //             $(".vex-dialog-message").text(marketClosed);
        //         }
        //     });
        // };
        //
        // var submit = function() {
        //     //obtain DTOs
        //     var networkGroups = internals.catalogGroupControls.map(function(group) {
        //         var groupData = group.getData();
        //         var retVal = {
        //             networkDTOs: groupData.collapsedRecs,
        //             mp: groupData.mp
        //         };
        //         return retVal;
        //     });
        //
        //     //and send it off
        //     dal.post("market/network/" + exports.mpDropdown.selected.val,
        //         networkGroups).then(function() {
        //             $("#dialogMsg").empty();
        //             Noty.success(ordersSubmitted);
        //         });
        // };
        //
        // var render = exports.render = function() {
        //     var renderer = new Renderer($("<div>"));
        //     renderer.renderView("networkDialog").then(function(el) {
        //         Modal.prompt({
        //             content: el,
        //             callback: submit,
        //             contentCSS: { width: "800px" },
        //             yesText: yesText
        //         });
        //         init();
        //     });
        // };
        // return exports;
    };
});
