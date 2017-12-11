define(["app/util"], function(util) {
    var registry = {};

    var lists = {};

    class Card {
        constructor(member, list) {
            this.memberId = member.id;
            this.list = list;
        }
        get id() {
            return `${this.list.name}/${this.memberId}`;
        }
        get for() {
            return this.list;
        }
        revoke() {
            this.list.remove(this.id);
        }
    }

    class Member {
        constructor(id, data) {
            this.id = id;
            this.data = data;
        }
    }

    class List {
        constructor(name) {
            this.name = name;
            this.nextId = 0;
            this.members = [];
        }
        addMember(data) {
            var member = new Member(this.nextId++, data);
            this.members.push(member);
            return new Card(member, this);
        }
        remove(id) {
            delete this.members[id];
        }
    }

    registry.register = (listName, data) =>
        util.safeSelect(lists, listName, List).addMember(data);

    return registry;
});
