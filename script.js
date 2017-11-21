$(function() {
    var posts = {};
    var postData = {};
    $.get("https://a.4cdn.org/pol/catalog.json", function(catalog) {
        catalog.forEach((page) => {
            page.threads.forEach((thread) => {
                $.get("https://a.4cdn.org/pol/thread/" + thread.no + ".json").done((threadData) => {
                    var threadPosts = {};
                    threadData.posts.forEach((post) => {
                        post.parentThread = thread.no;
                        postData[post.no] = post;
                        if(post.com)
                        {
                            var html = $("<div>").append($($.parseHTML(post.com.replace("<wbr>", ""))));

                            var repliesTo = html.find("a").each((idx, replyTo) => {
                                var replyToNum = $(replyTo).html().substr(8);
                                if(!isNaN(replyToNum))
                                {
                                    threadPosts[replyToNum] = threadPosts[replyToNum] ? threadPosts[replyToNum] + 1 : 1;
                                    posts = Object.assign(posts, threadPosts);
                                }
                            });
                        }
                    });
                });
            });
        });
    });

    $(document).ajaxStop(function() {
        var sorted = sortObject(posts);
        for(var i = 0; i < 300; i ++)
            renderPost(postData[sorted[i].key], sorted[i].value);
    });

    function renderPost(post, yous) {
        var thread = post.parentThread;
        var cunt = post.country;
        var name = post.name;
        var no = post.no;
        var filename = post.filename;
        var tim = post.tim;
        var ext = ".jpg";//post.ext;
        var com = post.com;

        var body = $(document.body);
        var postContainer = $("<div>").attr("class", "postContainer replyContainer");
            var sideArrows = $("<div>").attr("class", "sideArrows");
            var post = $("<div>").attr("class", "post reply");
                var postInfo = $("<div>").attr("class", "postInfo desktop");
                    var nameBlock = $("<span>").attr("class", "nameBlock");
                        var nameSpan = $("<span>").attr("class", "name").html(name);
                        var flag = $("<span>").attr("class", getFlagClass(cunt));
                    var postNum = $("<span>").attr("class", "postNum desktop").html("No. "+ no + " <b>(YOU) COUNT: " + yous + "</b>");
                    var viewPost = $("<span>").html(" <b>[VIEW POST]</b>");
                if(filename)
                {
                    var file = $("<div>").attr("class", "file");
                    var fileText = $("<div>").attr("class", "fileText").html("File: ");
                        var fileLink = $("<a>").attr("href", "https://i.4cdn.org/pol/"+ tim + ext).val(filename + ext);
                    var fileThumb = $("<a>").attr("class", "fileThumb").attr("href", "https://i.4cdn.org/pol/"+ tim + ext);
                        var img = $("<img>").attr("src", "https://i.4cdn.org/pol/"+ tim + "s" + ext);
                }
                var postMsg = $("<blockquote>").attr("class", "postMessage").html(com ? com : "");

        viewPost.css("cursor", "pointer");
        viewPost.click(() => require("electron").shell.openExternal("https://boards.4chan.org/pol/thread/" + thread + "/#p" + no));

        nameBlock.append(nameSpan).append(flag);
        if(filename)
        {
            fileText.append(fileLink);
            fileThumb.append(img);
        }

        postNum.append(viewPost);
        postInfo.append(nameBlock).append(postNum);
        if(filename) file.append(fileText).append(fileThumb);

        post.append(postInfo).append(file ? file : postMsg).append(postMsg);

        postContainer.append(sideArrows).append(post);

        body.append(postContainer);
    }

    function getFlagClass(cunt) {
        return "flag flag-" + cunt.toLowerCase();
    }

    function sortObject(obj) {
        var arr = [];
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                arr.push({
                    'key': prop,
                    'value': obj[prop]
                });
            }
        }
        arr.sort(function(a, b) {
            return b.value - a.value;
        });
        return arr;
    }
});
