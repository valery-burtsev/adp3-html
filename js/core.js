var auth = null;
var serverUrl = 'http://localhost:8080';
var $_GET = {};

$(document).ready(function () {
    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
        function decode(s) {
            return decodeURIComponent(s.split("+").join(" "));
        }

        $_GET[decode(arguments[1])] = decode(arguments[2]);
    });

    checkAuth();
    initPages();

});

function checkAuth() {
    var cookie = Cookies.get('evoting');
    if (cookie != undefined) {
        try {
            auth = JSON.parse(cookie);
        } catch {
            auth = null;
        }
    } else {
        if (window.location.pathname != '/login.html') {
            document.location = '/login.html';
        }
    }
}
function initPages() {
    if (window.location.pathname == '/login.html') {
        return initLogin();
    }
    initNavbar();
    if (window.location.pathname == '/parties.html') {
        return initParties();
    }
    if (window.location.pathname == '/addparty.html') {
        return initCreateParty();
    }
    if (window.location.pathname == '/party.html') {
        return initViewParty();
    }
    if (window.location.pathname == '/candidate.html') {
        return initViewCandidate();
    }
    if (window.location.pathname == '/candidates.html') {
        return initViewCandidates();
    }
    if (window.location.pathname == '/editcandidate.html') {
        return initCreateCandidate();
    }
    if (window.location.pathname == '/voters.html') {
        return initViewVoters();
    }
    if (window.location.pathname == '/voter.html') {
        return initViewVoter();
    }
    if (window.location.pathname == '/addvoter.html') {
        return initCreateVoter();
    }
}
function initLogin() {
    if (auth != null) {
        Cookies.remove('evoting');
        $("#loginSignout").removeClass("d-none")
    }

    $("#loginForm").submit(function (event) {
        event.preventDefault();
        $("#loginSignout").addClass("d-none")
        $("#loginError").addClass("d-none")
        var username = $("input#inputEmail").val();
        var password = $("input#inputPassword").val();

        $.ajax({
            url: serverUrl + '/',
            type: 'get',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', make_base_auth(username, password));
            },
            success: function (data, textStatus, xhr) {
                var resp = JSON.parse(data);
                if (xhr.status == 200) {
                    Cookies.set('evoting', JSON.stringify({ 'username': username, 'password': password, 'admin': resp.admin }));
                    document.location = '/';
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                if (xhr.status == 401) {
                    $("#loginError").removeClass("d-none")
                }
            }
        });
    });
}

function initCreateParty() {
    if (auth.admin == false) return document.location = '/parties.html?msg=You are not allowed to do that';

    var oldname = "";
    if ($_GET["id"] != null) {
        makeRequest('/party/read/' + $_GET["id"], 'get', null, function (resp) {
            if (resp.status) {
                document.location = '/parties.html?msg=' + resp.status;
            } else {
                $("#partyId").val(resp.party.partyId);
                $("#partyName").val(resp.party.name);
                oldname = resp.party.name;

                $("#delBtn").removeClass("d-none");
            }
        })
    }

    $("#delBtn").on("click", function(e){
        e.preventDefault();
        var confirm = window.confirm("Would you really like to delete this party? All candidates will have to be reassigned to another party!");
        if(confirm == true) {
            makeRequest('/party/delete/' + $_GET["id"], 'get', null, function (resp) {
                if (resp.status) {
                    document.location = '/parties.html?msg=' + resp.status;
                }
            })
        }
    })

    $("#addPartyForm").submit(function (event) {
        event.preventDefault();
        var name = $("input#partyName").val();
        var id = $("input#partyId").val();
        if (id.length == 0) id = ''; else id = '&partyId=' + id;

        if (name == oldname) return document.location = '/parties.html';

        makeRequest('/party/create?name=' + name + id, 'post', null, function (resp) {
            $("#creationError").text('').addClass("d-none");
            if (resp.error) {
                $("#creationError").text(resp.error).removeClass("d-none");
            } else {
                document.location = '/parties.html?msg=' + resp.status;
            }
        })
    })
}
function initCreateCandidate() {
    if (auth.admin == false) return document.location = '/candidates.html?msg=You are not allowed to do that';
    makeRequest('/party/read/all', 'get', null, function (resp) {
        for (var party in resp) {
            var html = '<option value=\"' + resp[party].partyId + '\">' + resp[party].name + '</option>';
            $("#partyId").append(html);
        }
    })

    var oldname = "";
    if ($_GET["id"] != null) {
        makeRequest('/candidate/read/' + $_GET["id"], 'get', null, function (resp) {
            if (resp.status) {
                document.location = '/candidates.html?msg=' + resp.status;
            } else {
                $("#candidateId").val(resp.candidate.candidateId);
                $("#candidateName").val(resp.candidate.fname);
                $("#candidateName2").val(resp.candidate.lname);
                if(resp.party && resp.party != null) $("select#partyId").val(resp.party.partyId); else $("select#partyId").val("");
                oldname = $("#candidateName").val() + " " + $("#candidateName2").val() + " " + $("select#partyId").val();

                $("#delBtn").removeClass("d-none");
            }
        })
    }

    $("#delBtn").on("click", function(e){
        e.preventDefault();
        var confirm = window.confirm("Would you really like to delete this candidate?");
        if(confirm == true) {
            makeRequest('/candidate/delete/' + $_GET["id"], 'get', null, function (resp) {
                if (resp.status) {
                    document.location = '/candidates.html?msg=' + resp.status;
                }
            })
        }
    })

    $("#addCandidateForm").submit(function (event) {
        event.preventDefault();

        var id = $("input#candidateId").val();
        var name = $("input#candidateName").val();
        var name2 = $("input#candidateName2").val();
        var party = $("select#partyId").val();

        if (id.length == 0) id = ''; else id = '&candId=' + id;

        if (name + " " + name2 + " " + party == oldname) return document.location = '/candidates.html';

        makeRequest('/candidate/create?cand=' + name + '&cand2=' + name2 + '&party=' + party + id, 'post', null, function (resp) {
            $("#creationError").text('').addClass("d-none");
            if (resp.error) {
                $("#creationError").text(resp.error).removeClass("d-none");
            } else {
                document.location = '/candidates.html?msg=' + resp.status;
            }
        })
    })
}

function initCreateVoter() {
    if (auth.admin == false) return document.location = '/voters.html?msg=You are not allowed to do that';

    if ($_GET["id"] != null) {
        makeRequest('/user/read/' + $_GET["id"], 'get', null, function (resp) {
            if (resp.status) {
                document.location = '/voters.html?msg=' + resp.status;
            } else {
                $("#userId").val(resp.user.idnumber).prop("disabled", true);
                $("#fname").val(resp.user.uname);
                $("#lname").val(resp.user.lname);
                $("#gender").val(resp.demograph.gender);
                $("#race").val(resp.demograph.race);
                $("#home").val(resp.contact.homePhone);
                $("#work").val(resp.contact.workPhone);
                $("#cell").val(resp.contact.cellPhone);
                $("#addr1").val(resp.address.addrLine1);
                $("#addr2").val(resp.address.addrLine2);
                $("#city").val(resp.address.city);
                $("#province").val(resp.address.province);
                $("#postcode").val(resp.address.postCode);

                $("#delBtn").removeClass("d-none");
            }
        })
    }

    $("#delBtn").on("click", function(e){
        e.preventDefault();
        var confirm = window.confirm("Would you really like to delete this voter?");
        if(confirm == true) {
            makeRequest('/user/delete/' + $_GET["id"], 'get', null, function (resp) {
                if (resp.status) {
                    document.location = '/voters.html?msg=' + resp.status;
                }
            })
        }
    })

    $("#addVoterForm").submit(function (event) {
        event.preventDefault();

        var id = $("#userId").val();
        var name = $("#fname").val();
        var name2 = $("#lname").val();
        var gender = $("#gender").val();
        var race = $("#race").val();
        var home = $("#home").val();
        var work = $("#work").val();
        var cell = $("#cell").val();
        var addr1 = $("#addr1").val();
        var addr2 = $("#addr2").val();
        var city = $("#city").val();
        var province = $("#province").val();
        var postcode = $("#postcode").val();

        makeRequest('/user/create?id=' + id + '&name=' + name + '&name2=' + name2 + '&gender=' + gender + '&race=' + race + '&home=' + home + '&work=' + work + '&cell=' + cell + '&addr1=' + addr1 + '&addr2=' + addr2 + '&city=' + city + '&province=' + province + '&postcode=' + postcode, 'post', null, function (resp) {
            $("#creationError").text('').addClass("d-none");
            if (resp.error) {
                $("#creationError").text(resp.error).removeClass("d-none");
            } else {
                document.location = '/voters.html?msg=' + resp.status;
            }
        })
    })
}

function initViewParty() {
    if ($_GET["id"] == null) {
        return document.location = '/parties.html';
    }
    if (auth.admin == true) $("#editBtn").removeClass("d-none");
    makeRequest('/party/read/' + $_GET["id"], 'get', null, function (resp) {
        if (resp.error) {
            $("#msg").find("span.text").text(resp.error);
            $("#msg").removeClass("d-none").removeClass("alert-success").addClass("alert-danger");
        } else {
            $("#editBtn").attr('href', '/addparty.html?id=' + resp.party.partyId);
            $(".candidatesContainer").html('');
            $(".candidatesContainer").append('<h5>Party name: ' + resp.party.name + '</h5><h6>This party has the following members:</h6>')
            for (var party in resp.candidates) {
                var html = '<div class="row mt-1">'
                html += '<a href="/candidate.html?id=' + resp.candidates[party].candidateId + '" class="partyRow col border d-flex align-items-center justify-content-center">'
                html += '<div class="icon party mr-2" style="height: 24px; width: 24px; display:inline-block"></div>'
                html += resp.candidates[party].name;
                html += '</a>'
                html += '</div>';

                $(".candidatesContainer").append(html);
            }
        }

    })
}

function initViewCandidate() {
    if ($_GET["id"] == null) {
        return document.location = '/candidates.html';
    }
    if (auth.admin == true) $("#editBtn").removeClass("d-none");

    makeRequest('/candidate/read/' + $_GET["id"], 'get', null, function (resp) {
        if (resp.error) {
            $("#msg").find("span.text").text(resp.error);
            $("#msg").removeClass("d-none").removeClass("alert-success").addClass("alert-danger");
        } else {
            $("#candidateName").text(resp.candidate.name);
            if(resp.party) {
                $("#candidateParty").html('<a href="/party.html?id=' + resp.party.partyId + '">' + resp.party.name + '</a>');
            }
            $("#editBtn").attr('href', '/editcandidate.html?id=' + resp.candidate.candidateId);
        }

    })
}

function initViewVoter() {
    if ($_GET["id"] == null) {
        return document.location = '/voters.html';
    }
    if (auth.admin == true) $("#editBtn").removeClass("d-none");

    makeRequest('/user/read/' + $_GET["id"], 'get', null, function (resp) {
        if (resp.error) {
            $("#msg").find("span.text").text(resp.error);
            $("#msg").removeClass("d-none").removeClass("alert-success").addClass("alert-danger");
        } else {
            $("#name").text(resp.user.uname + " " + resp.user.lname);
            $("#gender").text(resp.demograph.gender);
            $("#race").text(resp.demograph.race);
            $("#home").text(resp.contact.homePhone);
            $("#work").text(resp.contact.workPhone);
            $("#cell").text(resp.contact.cellPhone);
            var addr1 = resp.address.addrLine1 == null ? '' : resp.address.addrLine1;
            var addr2 = resp.address.addrLine2 == null || resp.address.addrLine2 == '' ? '' : "<br>"+resp.address.addrLine2;
            var city = resp.address.city == null ? '' : resp.address.city;
            var province = resp.address.province == null ? '' : resp.address.province;
            var postCode = resp.address.postCode == '0' ? '' : resp.address.postCode;

            $("#address").html(addr1 + addr2 + "<br>" + city + "<br>" + province + "<br>" + postCode);
            $("#editBtn").attr('href', '/addvoter.html?id=' + resp.user.idnumber);
        }

    })
}

function initViewVoters() {
    if ($_GET["msg"]) {
        $("#msg").find("span.text").text($_GET["msg"]);
        $("#msg").removeClass("d-none");
    }
    if (auth.admin == true) $("#regVoter").removeClass("d-none");
    makeRequest('/user/read/all', 'get', null, function (resp) {
        $(".partyContainer").html('');
        for (var party in resp) {
            var html = '<div class="row mt-1">'
            html += '<a href="/voter.html?id=' + resp[party].user.idnumber + '" class="partyRow col border d-flex align-items-center justify-content-center">'
            html += '<div class="icon user mr-2" style="height: 24px; width: 24px; display:inline-block"></div>'
            html += resp[party].user.uname + " " + resp[party].user.lname;
            html += '</a>'
            html += '</div>';

            $(".partyContainer").append(html);
        }
    })
}

function initNavbar() {
    if (auth != null) {
        $("#navUsername").text(auth.username);
        if (auth.admin == true) $("#navUsername").next().removeClass("d-none");
    }
}

function initParties() {
    if ($_GET["msg"]) {
        $("#msg").find("span.text").text($_GET["msg"]);
        $("#msg").removeClass("d-none");
    }
    if (auth.admin == true) $("#editBtn").removeClass("d-none");
    makeRequest('/party/read/all', 'get', null, function (resp) {
        $(".partyContainer").html('');
        for (var party in resp) {
            var html = '<div class="row mt-1">'
            html += '<a href="/party.html?id=' + resp[party].partyId + '" class="partyRow col border d-flex align-items-center justify-content-center">'
            html += '<div class="icon party mr-2" style="height: 24px; width: 24px; display:inline-block"></div>'
            html += resp[party].name;
            html += '</a>'
            html += '</div>';

            $(".partyContainer").append(html);
        }
    })
}
function initViewCandidates() {
    if ($_GET["msg"]) {
        $("#msg").find("span.text").text($_GET["msg"]);
        $("#msg").removeClass("d-none");
    }
    if (auth.admin == true) $("#editBtn").removeClass("d-none");
    makeRequest('/candidate/read/all', 'get', null, function (resp) {
        $(".partyContainer").html('');
        for (var party in resp) {
            var html = '<div class="row mt-1">'
            html += '<a href="/candidate.html?id=' + resp[party].candidateId + '" class="partyRow col border d-flex align-items-center justify-content-center">'
            html += '<div class="icon user mr-2" style="height: 24px; width: 24px; display:inline-block"></div>'
            html += resp[party].name;
            html += '</a>'
            html += '</div>';

            $(".partyContainer").append(html);
        }
    })
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
}

function makeRequest(path, method, data, callback) {
    if (auth == null) document.location = '/login.html';
    if (method == null) method = 'get';
    var username = auth.username,
        password = auth.password;

    $.ajax({
        url: serverUrl + path,
        type: method,
        data: data,
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth(username, password));
        },
        success: function (data, textStatus, xhr) {
            if (xhr.status == 200) {
                callback(data);
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            if (xhr.status == 401) {
                Cookies.remove('evoting');
                document.location = '/login.html';
            }
            if (xhr.status == 400) {
                var r = JSON.parse(xhr.responseText);
                callback({ 'error': r.status })
            }
            if (xhr.status == 403) {
                callback({ 'error': 'You are not allowed to do that' });
            }
        }
    });
}