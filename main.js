// Firebase data.
var database = firebase.database();

var account;

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
        updateReservePage(1);
      } else {
        alert('密碼錯誤');
      }
    } else {
      alert('無此帳號');
    }
  });
})

// Initialize the date of thisWeek or nextWeek(according to boolean arg 'nextWeek').
function initDate(date, nextWeek) {
  var now = {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate(),
    week: date.getDay()
  };
  var monthArray = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
  var weekArray = new Array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');
  if (now.year % 4 == 0) dateOfMonth[1] = 29;


  // Display the week.
  for (var i = 0; i < 7; ++i) {
    // Get the date of this Sunday.
    var date = now.date - now.week + i;
    if (nextWeek) date += 7;
    var month = now.month;
    if (date < 1) {
      if (month == 0) {
        date += 31; month = 11;
      } else {
        date += monthArray[--month];
      }
    } else if (date > monthArray[now.month]) {
      if (month == 11) {
        date -= 31; month = 0;
      } else {
        date -= monthArray[++month];
      }
    }

    var result = ++month < 10 ? '0' : '';
    result += month + '-';
    if (date < 10) result += '0';
    result += date;
    $('#re-' + weekArray[i]).text(result);
  }
}

function updateReservePage(room) {
  firebase.database().ref('accounts/' + id + '/lastLogin').once('value', function(snapshot) {
    initDate(new Date(snapshot.val()), false);
    // var options = {
    //     weekday: "long", year: "numeric", month: "short",
    //     day: "numeric", hour: "2-digit", minute: "2-digit"
    // };
    // alert('測試取得資料庫時間: ' + date.toLocaleDateString("en-US", options));
  });
}

// Siwtch to new account page.
$('#ln-btn-new-account').click(function() {
  $('#login').hide();
  $('#new-account').show();
})

// Switch to login page
$('#na-btn-back-login').click(function() {
  $('#na-name').val('');
  $('#na-id').val('');
  $('#na-password').val('');
  $('#new-account').hide();
  $('#login').show();
})

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
        alert('錯誤#1');
      }
    }
  });
})