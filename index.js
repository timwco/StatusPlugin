;(function () {

  var token;
  var weekend;
  var org;
  var user;
  var ghAPI = 'https://api.github.com/repos/';
  var regex = /Assignment (.*)/i;
  var pointsAvailable = 0;
  var student_points = [];

  function checkComplete() {
    // Remap Object & Add a percentage
    student_points.forEach( function (sp) {
      sp.percentageComplete = Math.floor((sp.points / pointsAvailable) * 100);
    });
  
    // Now that we have everything, let's add to the page
    showPercentOnPage();
  }

  function showPercentOnPage() {

    // Find Element
    var $infoBlock = document.querySelector('.vcard-names');

    // Student's Info
    var studentByNode = student_points[0];

    // Create our percent element
    var infoDiv = document.createElement('div');
    var className = '';

    if (studentByNode.percentageComplete < 65) {
      className = 'tw_danger3';
    } else if (studentByNode.percentageComplete < 80) {
      className = 'tw_warning3';
    } else {
      className = 'tw_good3';
    }

    // Fuck Yeah ES6 Template strings
    var htmlContent = `
      <div class="tw_percent3">
        <h3>The Iron Yard</h3>
        <p>
          Assignment Completion: 
          <span class="${className}">
            ${studentByNode.percentageComplete}%
          </span>
        </p>
        <p>
          <a target="_blank" href="https://github.com/${org}/Assignments/issues/assigned/${user}">Your Assignments</a> | 
          <a target="_blank" href="https://github.com/twhitacre/StatusPlugin/wiki/Help">Help <span class="octicon octicon-question"></span></a>
        </p>
      </div>
    `;

    // Dump Our Final node to the page
    $infoBlock.insertAdjacentHTML('afterend', htmlContent);
  }

  function getJSON(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var resp = JSON.parse(xhr.responseText);
        cb(resp);
      }
    }
    xhr.send();
  }

  function loadOpenRatio(repo) {

    // Get the count of assignments
    // Generate an array of all of the assignments
    var issue_url = ghAPI+org+'/'+repo+'/issues?state=all&assignee='+user;
    if (token) { issue_url = issue_url + "&access_token=" + token; }
    getJSON(issue_url, function (issues) {
      var assignmentCount = [];
      for (var i = 1; i <= issues.length; i++) {
        assignmentCount.push(i);
      }

      // Get total points available
      assignmentCount.forEach( function (a) {
        if (weekend.indexOf(a) >= 0){
          pointsAvailable += 4;
        } else {
          pointsAvailable += 1;
        }
      });

      // Get all closed issues by user      
      var params = 'state=closed&labels=complete&assignee='+user;
      var user_issues_url = ghAPI+org+'/'+repo+'/issues?'+params;
      if (token) { user_issues_url = user_issues_url + "&access_token=" + token; }

      getJSON(user_issues_url, function (user_issues) {

        // Check which assignment it is (regex)
        var user_assignments_complete = [];
        if(user_issues.length > 0) {
          user_issues.forEach(function (issue) {
            var assignment = issue.title.match(regex);
            user_assignments_complete.push(Number(assignment[1]));
          });
        }


        // Calculate their points & percentage
        // Build an array of students, with name & points            
        var yourPoints = 0;
        user_assignments_complete.forEach( function (a) {
          if (weekend.indexOf(a) >= 0){
            yourPoints += 4;
          } else {
            yourPoints += 1;
          }
        });

        student_points.push({
          student: user,
          points: yourPoints
        });


        // Method to check for complete
        checkComplete();

      });
    });
  }

  function run(items) {
    var matches = window.location.pathname.match(/\/(.*)/);
    var myAccount = matches[1];

    if (myAccount === user) {

      getJSON('https://raw.githubusercontent.com/'+org+'/Data/master/weekend.json', function (response) {
        weekend = response;      
        loadOpenRatio('Assignments');
      });
    }
  }

  chrome.storage.sync.get(['token', 'org', 'user'], function(items) {
    token = items.token;
    org = items.org;
    user = items.user;
    run();
  });
  

}());