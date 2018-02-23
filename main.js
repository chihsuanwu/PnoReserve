function updateTime() {
  var nowDate = new Date();
  var d = nowDate.getDay();
  var dayNames = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
  $('#time').text(nowDate.toLocaleString() + '(' + dayNames[d] + ')');
  setTimeout('updateTime()', 1000);
}

$('#time').ready(function() {
  updateTime();
});

// Firebase data.
var database = firebase.database();

var weekArray = new Array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');

var account = {};
var reserveData = {};
var counter = 0;
var loginDate = null;

var room = null;

// Datebase listener;
var listener = null;
//var listenTo = '';
var listenData = {};

// Login
$('#ln-login').click(function() {
  $('#ln-email-message').text('');
  $('#ln-password-message').text('');
  var email = $('#ln-email').val();
  var password = $('#ln-password').val();
  if (email.length == 0 || email.trim().length == 0) {
    $('#ln-email-message').text('請輸入信箱');
    $('#ln-email').focus();
    return;
  }
  $('#loading').css('background-color', 'rgba(0, 0, 0, 0)').show().animate({
    'background-color' : 'rgba(0, 0, 0, 0.6)'
  }, 1000);
  firebase.auth().signInWithEmailAndPassword(email, password).then(function(user) {
    // Set last login time.
    firebase.database().ref('users/' + user.uid + '/lastLogin').set(firebase.database.ServerValue.TIMESTAMP);
    // Get user data.
    firebase.database().ref('users/' + user.uid).once('value', function(snapshot) {
      $('#loading').hide();
      var name = snapshot.child('name').val();
      var id = snapshot.child('id').val();
      $('#login-new-account').hide();
      $('#loading').hide();
      $('#reserve').show();
      $('#tl-user').text(name);
      account = {
        firebaseId: user.uid,
        id: id, name: name,
        email: email
      };
      counter = snapshot.child('counter').val();
      snapshot.child('reserved').forEach(function(child) {
        reserveData[child.key] = child.val();
      });
      var now = new Date(snapshot.child('lastLogin').val());
      loginDate = {
        year: now.getFullYear(),
        month: now.getMonth(),
        date: now.getDate(),
        week: now.getDay()
      };
      // Init reserve table.
      initDate(false);
      room = 1;
      listenToReserveData(false);
    });
  }).catch(function(error) {
    $('#loading').hide();
    switch (error.code) {
      case 'auth/user-not-found': $('#ln-email-message').text('此帳號不存在'); $('#ln-email').focus(); break;
      case 'auth/invalid-email': $('#ln-email-message').text('信箱格式錯誤'); $('#ln-email').focus(); break;
      case 'auth/wrong-password': $('#ln-password-message').text('密碼錯誤'); $('#ln-password').focus();  break;
      default: alert('錯誤#84\n' + error.code + '\n' + error.message);
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
      date += monthArray[month--];
    }
  } else if (date > monthArray[month]) {
    if (month == 11) {
      date -= 31; month = 0; ++year;
    } else {
      date -= monthArray[month++];
    }
  }

  return { year: year, date: ('0' + date).slice(-2), month: ('0' + ++month).slice(-2) };
}

// Initialize the date of thisWeek or nextWeek(according to boolean arg 'nextWeek').
function initDate(nextWeek) {
  if (loginDate == null) alert('錯誤#77');

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

function listenToReserveData(nextWeek) {
  if (loginDate == null || room == null) {
    alert('錯誤#104');
    return;
  }

  $('#re-room1').prop('disabled', room == 1);
  $('#re-room2').prop('disabled', room == 2);
  $('#re-room3').prop('disabled', room == 3);

  // Get the date string that going to recive.
  var offset = -loginDate.week;
  if (nextWeek) offset += 7;
  date = getOffsetDate(offset);
  var week = (new Date(date.year + '-' + date.month + '-' + date.date + ' 08:00')).getTime();

  var target = room + '/' + week;
  // If date and room not change, return.
  if (listenData.string == target) return;

  // Close the old listener and start a new one.
  if (listener != null) listener.off('value');

  listenData.string = target;
  listenData.week = week;
  listenData.room = room;
  listener = firebase.database().ref(target);
  $('.re-li').text('');
  listener.on('value', function(snapshot) {
    $('.re-li').text('');
    snapshot.forEach(function(child) {
      $('#re-' + child.key).text(child.child('name').val());
    });
  });
}

// Siwtch to new account page.
$('#ln-new-account').click(function() {
  $('#ln-email').val('');
  $('#ln-password').val('');
  $('#ln-email-message').text('');
  $('#ln-password-message').text('');
  $('#login').animate({ left: "-=400px" }, 200);
  $('#new-account').animate({ left: "-=400px" }, 200);
});

// Switch to login page
$('#na-back-login').click(function() {
  $('#na-name').val('');
  $('#na-id').val('');
  $('#na-email').val('');
  $('#na-password').val('');
  $('#na-name-message').text('');
  $('#na-id-message').text('');
  $('#na-email-message').text('');
  $('#na-password-message').text('');
  $('#login').animate({ left: "+=400px" }, 200);
  $('#new-account').animate({ left: "+=400px" }, 200);
});

// Create new account.
$('#na-new-account').click(function() {
  $('#na-name-message').text('');
  $('#na-id-message').text('');
  $('#na-email-message').text('');
  $('#na-password-message').text('');
  name = $('#na-name').val();
  id = $('#na-id').val();
  password = $('#na-password').val();
  email = $('#na-email').val();

  if (name.length == 0 || name.trim().length == 0) {
    $('#na-name-message').text('請輸入名字');
    return;
  }
  if (id.length == 0 || id.trim().length == 0) {
    $('#na-id-message').text('請輸入學號');
    return;
  }
  if (email.length == 0 || email.trim().length == 0) {
    $('#na-email-message').text('請輸入信箱');
    return;
  }

  $('#loading').show();
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(users) {
    // Create account in database.
    firebase.database().ref('users/' + users.uid).set({ name: name, id: id, counter: 0 }, function(error) {
      $('#loading').hide();
      if (error) {
        alert('#錯誤171\n' + error.code + '\n' + error.message);
      } else {
        $('#ln-email').val($('#na-email').val());
        $('#na-name').val('');
        $('#na-id').val('');
        $('#na-email').val('');
        $('#na-password').val('');
        $('#login').animate({ left: "+=400px" }, 200);
        $('#new-account').animate({ left: "+=400px" }, 200);
      }
    });
  }).catch(function(error) {
    $('#loading').hide();
    switch (error.code) {
      case 'auth/invalid-email': $('#na-email-message').text('信箱格式錯誤'); $('#na-email').focus(); break;
      case 'auth/email-already-in-use': $('#na-email-message').text('信箱已被使用'); $('#na-email').focus(); break;
      case 'auth/weak-password': $('#na-password-message').text('密碼長度需至少6個字');
                                 $('#na-password').focus(); break;
      default: alert('錯誤#84\n' + error.code + '\n' + error.message);
    }
  });
});

$('#re-lastweek').click(function() {
  initDate(false);
  listenToReserveData(false);
});

$('#re-nextweek').click(function() {
  initDate(true);
  listenToReserveData(true);
});

$('.re-room').click(function() {
  room = parseInt(this.id.slice(7, 8));
  initDate(false);
  listenToReserveData(false);
});

function showPopUp(x, y, title, message, status, okArgs) {
  $('#p-title').text(title);
  $('#p-message').text(message);
  $('#p-ok').off('click');
  $('#p-ok').click(function() {
    switch (status) {
      case 'RESERVE': reserve(okArgs); break;
      case 'CANCELRESERVE': cancelReserve(okArgs); break;
      default: alert('#錯誤');
    }
    $('#popup').hide();
  });
  $('#popup').show();
  $('#p-container').css({ left: x, top: y });
}

$('#popup').click(function() {
  $('#p-container').animate({ "border-color": "#f20" }, 60);
  $('#p-container').animate({ "border-color": "#888" }, 60);
  $('#p-container').animate({ "border-color": "#f20" }, 60);
  $('#p-container').animate({ "border-color": "rgba(120, 120, 120, 0.9)" }, 60);
});

$('#p-container').click(function(e) {
  e.stopPropagation();
})

$('#p-cancel').click(function() {
  $('#popup').hide();
});

function reserve(time) {
  // Update these data simultaneously:
  //   users/<uid>/reserved/time<n>
  //   users/<uid>/counter
  //   <room>/<date>/<time>
  var data = {};
  var inf = {
    week: listenData.week,
    time: time,
    room: listenData.room
  };
  data['users/' + account.firebaseId + '/reserved/' + (counter + 1)] = inf;
  data['users/' + account.firebaseId + '/counter'] = counter + 1;
  data[listenData.string + '/' + time] = {
    name: account.name,
    id: account.id,
    count: counter + 1
  }

  firebase.database().ref().update(data, function(error) {
    if (error) {
      alert('#錯誤211\n' + error.code + '\n' + error.message);
    } else {
      ++counter;
      reserveData[counter] = Object.assign({}, inf);
      alert('成功預定');
    }
  });
}

function cancelReserve(time) {
  var data = {};
  var inf = {
    week: listenData.week,
    time: time,
    room: listenData.room
  };
  // Last data is the data that going to delete.
  var matchLast = reserveData[counter].week === inf.week &&
                  reserveData[counter].time === inf.time &&
                  reserveData[counter].room === inf.room;

  var changeN, changeInf;
  if (!matchLast) {
    changeN = Object.keys(reserveData).find(key => (reserveData[key].week == inf.week &&
                                                  reserveData[key].time == inf.time &&
                                                  reserveData[key].room == inf.room));
    changeInf = reserveData[counter];
    data['users/' + account.firebaseId + '/reserved/' + changeN] = Object.assign({}, changeInf);
    data[changeInf.room + '/' + changeInf.week + '/' + changeInf.time + '/count'] =
        parseInt(changeN);
  }

  data['users/' + account.firebaseId + '/reserved/' + counter] = null;
  data['users/' + account.firebaseId + '/counter'] = counter - 1;
  data[listenData.string + '/' + time] = null;

  firebase.database().ref().update(data, function(error) {
    if (error) {
      alert('#錯誤221\n' + error.code + '\n' + error.message);
    } else {
      if (!matchLast) {
        reserveData[changeN] = Object.assign({}, changeInf);
      }
      reserveData[counter] = null;
      --counter;
      alert('成功取消');
    }
  });
}

$('.re-li').click(function(e) {
  if ($(this).text() == '') {
    if (counter >= 7) {
      alert('預訂時段已達上限7次');
      return;
    }
    var x = e.pageX-122+"px", y = e.pageY-140+"px";
    var date = $('#re-' + this.id.slice(3, 6)).text(), time = parseInt(this.id.slice(7, 9));
    var message = '預訂琴房' + room + ' ' + date + ' ' + time + ':00~' + (time + 1) + ':00'+
                  '\n剩餘預定次數:' + (7 - counter);
    showPopUp(x, y, '預訂確認', message, 'RESERVE', this.id.slice(3, 9));
  } else if ($(this).text() == account.name) {
    var x = e.pageX-122+"px", y = e.pageY-140+"px";
    var date = $('#re-' + this.id.slice(3, 6)).text(), time = parseInt(this.id.slice(7, 9));
    var message = '取消預訂琴房' + room + ' ' + date + ' ' + time + ':00~' + (time + 1) + ':00';
    showPopUp(x, y, '取消確認', message, 'CANCELRESERVE', this.id.slice(3, 9));
  }
});

$('#tl-user').click(function() {
  alert("User's information testing\n" + account.name + '\n' + account.id + '\n' + account.email);
});

$(function() {
  firebase.database().ref('message').once('value', function(snapshot) {
    if (snapshot.val() != null) {
      alert(snapshot.val());
    }
  });
});