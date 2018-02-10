// Firebase data.
var database = firebase.database();

var weekArray = new Array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');

var account;
var loginDate = null;

// Datebase listener;
var listener = null;
var listenTo = '';

// Login
$('#ln-btn-login').click(function() {
  id = $('#ln-id').val();
  password = $('#ln-password').val();
  if (id.length == 0 || id.trim().length == 0) {
    alert('請輸入學號');
    return;
  }
  firebase.database().ref('accounts/' + id).once('value', function(snapshot) {
    if (snapshot.hasChild('password')) {
      if (password == snapshot.val().password) {
        name = snapshot.val().name;
        alert(name + '/'+ id + '登入成功');
        firebase.database().ref('accounts/' + id + '/lastLogin').set(firebase.database.ServerValue.TIMESTAMP);

        $('#login').hide();
        $('#reserve').show();
        account = { id: id, name: name};
        firebase.database().ref('accounts/' + id + '/lastLogin').once('value', function(snapshot) {
          var now = new Date(snapshot.val());
          loginDate = {
            year: now.getFullYear(),
            month: now.getMonth(),
            date: now.getDate(),
            week: now.getDay()
          };
          initDate(false);
          listenToReserveData(1, false);
        });
      } else {
        alert('密碼錯誤');
      }
    } else {
      alert('無此帳號');
    }
  });
});

function getOffsetDate(offset) {
  var monthArray = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
  if (loginDate.year % 4 == 0) monthArray[1] = 29;

  var date = loginDate.date + offset;
  var month = loginDate.month;
  var year = loginDate.year;
  if (date < 1) {
    if (month == 0) {
      date += 31; month = 11; --year;
    } else {
      date += monthArray[--month];
    }
  } else if (date > monthArray[loginDate.month]) {
    if (month == 11) {
      date -= 31; month = 0; ++year;
    } else {
      date -= monthArray[++month];
    }
  }

  return { year: year, date: ('0' + date).slice(-2), month: ('0' + ++month).slice(-2) };
}

// Initialize the date of thisWeek or nextWeek(according to boolean arg 'nextWeek').
function initDate(nextWeek) {
  if (loginDate == null) alert('錯誤#69');

  $('#re-nextweek').prop('disabled', nextWeek);
  $('#re-lastweek').prop('disabled', !nextWeek);
  $('#re-week').text(nextWeek ? '下周' : '本周');

  // Display the week.
  for (var i = 0; i < 7; ++i) {
    var offset = i - loginDate.week;
    if (nextWeek) offset += 7;
    var offsetDate = getOffsetDate(offset);

    var dateString = offsetDate.month + '-' + offsetDate.date;
    $('#re-' + weekArray[i]).text(dateString);
  }
}

function listenToReserveData(room, nextWeek) {
  if (loginDate == null) alert('錯誤#91');

  // Get the date string that going to recive.
  var offset = -loginDate.week;
  if (nextWeek) offset += 7;
  offsetDate = getOffsetDate(offset);
  var dateString = offsetDate.year + offsetDate.month + offsetDate.date;
  //alert(dateString);

  var target = 'room' + room + '/' + dateString;
  // If date and room not change, return.
  if (listenTo == target) return;

  // Close the old listener and start a new one.
  if (listener != null) listener.off('value');

  listenTo = target;
  listener = firebase.database().ref(listenTo);
  listener.on('value', function(snapshot) {
    $('.re-li').text('');
    snapshot.forEach(function(child) {
      $('#re-' + child.key).text(child.child('name').val());
    });
  });
}

// Siwtch to new account page.
$('#ln-btn-new-account').click(function() {
  $('#login').hide();
  $('#new-account').show();
});

// Switch to login page
$('#na-btn-back-login').click(function() {
  $('#na-name').val('');
  $('#na-id').val('');
  $('#na-password').val('');
  $('#new-account').hide();
  $('#login').show();
});

function createAccount(name, id, password) {
  return firebase.database().ref('accounts/' + id).set({
    name: name,
    password: password
  });
}

// Create new account.
$('#na-btn-new-account').click(function() {
  name = $('#na-name').val();
  id = $('#na-id').val();
  password = $('#na-password').val();

  if (name.length == 0 || name.trim().length == 0) {
    alert('請輸入名字');
    return;
  }
  if (id.length == 0 || id.trim().length == 0) {
    alert('請輸入學號');
    return;
  }
  if (password.length < 6 || password.length > 20) {
    alert('密碼須為6至20字');
    return;
  }

  firebase.database().ref('accounts').once('value', function(snapshot) {
    if (snapshot.hasChild(id)) {
      alert(id + '為已註冊帳號');
    } else {
      result = createAccount(name, id, password);
      if (result) {
        alert('帳號建立成功');
        $('#na-name').val('');
        $('#na-id').val('');
        $('#na-password').val('');
        $('#new-account').hide();
        $('#login').show();
      } else {
        alert('錯誤#144');
      }
    }
  });
});

$('#re-lastweek').click(function() {
  initDate(false);
  listenToReserveData(1, false);
});

$('#re-nextweek').click(function() {
  initDate(true);
  listenToReserveData(1, true);
});

$('.re-li').click(function() {
  if ($(this).text() == '') {
    if (confirm('預定此時間?')) {
      firebase.database().ref(listenTo + '/' + this.id.substr(3, 9)).set({
        name: account.name,
        id: account.id
      });
    }
  } else if ($(this).text() == account.name) {
    if (confirm('取消預定?')) {
      firebase.database().ref(listenTo + '/' + this.id.substr(3, 9)).remove();
    }
  }
});
