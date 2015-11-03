;(function () {

  var token;
  var weekend;
  var ghAPI = 'https://api.github.com/repos/';
  var regex = /Assignment (.*)/i;
  var pointsAvailable = 0;
  var student_points = [];

  function checkComplete(len) {
    if (student_points.length >= len) {
      
      // Remap Object & Add a percentage
      student_points.forEach( function (sp) {
        sp.percentageComplete = Math.floor((sp.points / pointsAvailable) * 100);
      });
    
      // Now that we have everything, let's add to the page
      showPercentOnPage();
    }
  }

  function showPercentOnPage() {
    var $rows = document.querySelectorAll('.js-org-person');
    [].forEach.call($rows, function ($row) {

      // Find the elements on the page we will need to access
      var $userBlock = $row.querySelector('.member-info').querySelector('.member-username');
      var $finalArea = $row.querySelector('.member-meta');

      // Read current node's username and get that user info
      var login = $userBlock.innerHTML;
      var studentByNode = student_points.filter( function (s) {
        return s.student === login;
      });

      // Create our percent element
      var spanTag = document.createElement('span');
      var percent = document.createTextNode(studentByNode[0].percentageComplete + '%');
      spanTag.classList.add('tw_percent');
      spanTag.appendChild(percent);

      // Check for danger zone
      if (studentByNode[0].percentageComplete < 80) {
        spanTag.classList.add('tw_danger');
      }

      // Check for non Student members
      if (studentByNode[0].points <= 0){
        spanTag.classList.add('tw_grey');
        spanTag.innerHTML = "N/A";
      }

      // Empty the 2-Factor Area and
      // Replace with our customized span
      $finalArea.innerHTML = '';
      $finalArea.appendChild(spanTag);

    });

    // Hide Spinner
    toggleSpinner(false);
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

  function loadOpenRatio(repo, owner) {

    // Get All users
    var user_url = ghAPI+owner+'/'+repo+'/assignees';
    if (token) { user_url = user_url + "?access_token=" + token + '&per_page=100'; }
    getJSON(user_url, function (users) {

      // Get the count of assignments
      // Generate an array of all of the assignments
      // FIX ME - just being lazy. Need a user to get assignment count.
      // FIX ME - there has to be a better way
      var issue_url = ghAPI+owner+'/'+repo+'/issues?state=all&assignee='+users[0].login;
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
        users.forEach( function (user) {
          
          var params = 'state=closed&labels=complete&assignee='+user.login;
          var user_issues_url = ghAPI+owner+'/'+repo+'/issues?'+params;
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
              student: user.login,
              points: yourPoints
            });


            // Method to check for complete
            checkComplete(users.length);

          });
        });



      });
    });
  }

  function toggleSpinner (show) {

    // Find Nav Area
    $navArea = document.querySelector('.subnav-links');

    if(show) {

      // Build Container
      var $container = document.createElement('a');
      $container.classList.add('subnav-item');
      $container.classList.add('tw_loader-stuff');

      // Create Text Node
      var $text = document.createTextNode('Calculating ');

      // Build Spinner
      var $spinner = document.createElement('span');
      $spinner.classList.add('tw_throbber-loader');

      // Put it all together and display
      $container.appendChild($text);
      $container.appendChild($spinner);
      $navArea.appendChild($container);

    } else {
      document.querySelector('.tw_loader-stuff').style.display = 'none';
    }
  }

  function run() {
    var matches, repo, owner;

    matches = window.location.pathname.match(/^\/.+\/(.+)\/people/);

    if (matches) {
      owner = matches[1];
      repo = 'Assignments';

      getJSON('https://raw.githubusercontent.com/'+owner+'/Data/master/weekend.json', function (response) {
        weekend = response;      
        loadOpenRatio(repo, owner);
        toggleSpinner(true);
      });
    }
  }

  chrome.storage.sync.get(['token', 'weekend'], function(items) {
    token = items.token;
    run();
  });
  

}());