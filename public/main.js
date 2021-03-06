function updateTime(now) {
  now += 1000;
  var date = new Date();
  if (timeOffset != 0) {
    date.setTime(date.getTime() + timeOffset);
  }

  var d = date.getDay();
  var day = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
  $('#time').text(date.toLocaleString() + '(' + day[d] + ')');
  timer = setTimeout(function(){ updateTime(now); }, 1000);
}

function setTime(time) {
  var now = (new Date()).getTime();
  if (now - time > 60000 && now - time < -60000) {
    timeOffset = now - time;
  } else {
    timeOffset = 0;
  }
  updateTime(now);
}

var timer = null;
var timeOffset = 0;

// Firebase data.
var database = firebase.database();

var account = {};
var reserveData = {};
var counter = 0;
var loginDate = null;

// Datebase listener;
var listener = null;
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
  // Loading animate.
  $('#loading').css('background-color', 'rgba(0, 0, 0, 0)').show().animate({
    'background-color' : 'rgba(0, 0, 0, 0.6)'
  }, 1000);
  firebase.auth().signInWithEmailAndPassword(email, password).then(function(user) {
    // Set last login time.
    firebase.database().ref('users/' + user.uid + '/info/lastLogin')
                       .set(firebase.database.ServerValue.TIMESTAMP);
    // Get user data.
    firebase.database().ref('users/' + user.uid + '/info').once('value', function(snapshot) {
      $('#loading').hide();
      var name = snapshot.child('name').val();
      var id = snapshot.child('id').val();
      var card = snapshot.child('card').val();
      $('#login-new-account').hide();
      $('#loading').hide();
      $('#reserve').show();
      $('#user').text(name);
      setTime(snapshot.child('lastLogin').val());
      account = {
        firebaseId: user.uid,
        id: id,
        name: name,
        card: card,
        email: email
      };

      loginDate = new Date(snapshot.child('lastLogin').val());
      $('#user').show();
      // Init reserve table.
      initDate(0);
      listenToReserveData(0, 1);
    });
  }).catch(function(error) {
    $('#loading').hide();
    switch (error.code) {
      case 'auth/user-not-found': $('#ln-email-message').text('此帳號不存在'); $('#ln-email').focus(); break;
      case 'auth/invalid-email': $('#ln-email-message').text('信箱格式錯誤'); $('#ln-email').focus(); break;
      case 'auth/wrong-password': $('#ln-password-message').text('密碼錯誤'); $('#ln-password').focus();  break;
      default: alert('Error#89\n' + error.code + '\n' + error.message);
    }
  });
});

function offsetDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Initialize the date according to 'dayOffset'(0 for this week, 7 for next week, 14 for next next week).
function initDate(dayOffset) {
  if (loginDate == null) {
    alert('Error#103'); return;
  }

  $('#re-nextweek').prop('disabled', dayOffset === 14 ||
    (dayOffset === 7 && (loginDate.getDay() > 0 || loginDate.getHours() < 8)));
  $('#re-lastweek').prop('disabled', dayOffset === 0);
  switch (dayOffset) {
    case 0: $('#re-week').text('本週'); break;
    case 7: $('#re-week').text('下週'); break;
    case 14: $('#re-week').text('下下週'); break;
    default: alert('Error#113');
  }

  var weekArray = new Array('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

  // Display the week.
  var day = loginDate.getDay();
  dayOffset -= (day === 0 ? 6 : day - 1);
  for (var i = 0; i < 7; ++i) {

    var offset = i + dayOffset;
    var offsetDate = offsetDays(loginDate, offset);

    var monthStr = ('0' + (offsetDate.getMonth() + 1)).slice(-2),
        dateStr = ('0' + offsetDate.getDate()).slice(-2);
    $('#re-' + weekArray[i]).text(monthStr + '-' + dateStr);
  }
}

// Listen to firebase.
function listenToReserveData(dayOffset, room) {
  if (loginDate == null) {
    alert('Error#135'); return;
  }

  $('#re-room1').prop('disabled', room == 1);
  $('#re-room2').prop('disabled', room == 2);
  $('#re-room3').prop('disabled', room == 3);

  // Get the date string that going to recive.
  var day = loginDate.getDay();
  dayOffset -= (day === 0 ? 6 : day - 1);
  var offsetDate = offsetDays(loginDate, dayOffset);
  offsetDate.setHours(0, 0, 0, 0);
  var week = offsetDate.getTime();

  // If date and room not change, return.
  if (listenData.week === week && listenData.room === room) return;

  // Loading animate.
  $('#re-loading').finish().css('background-color', 'rgba(0, 0, 0, 0)').show().animate({
    'background-color' : 'rgba(0, 0, 0, 0.6)'}, 1000);

  // Close the old listener and start a new one.
  if (listener != null) listener.off('value');

  listenData.week = week;
  listenData.room = room;
  listener = firebase.database().ref(room + '/' + week + '/times');
  $('.re-th').text('');

  firebase.database().ref('users/' + account.firebaseId + '/reserved/' + week)
      .once('value', function(snapshot) {
    if (snapshot.hasChild('count')) {
      counter = snapshot.child('count').val();
      snapshot.child('times').forEach(function(child) {
        reserveData[child.key] = child.val();
      });
    } else {
      counter = 0;
      reserveData = {};
    }

    //alert(JSON.stringify(reserveData))
    listener.on('value', function(snapshot) {
      $('#re-loading').hide();
      $('.re-th').text('');
      listenData.count = 0;
      snapshot.forEach(function(child) {
        ++listenData.count;
        var display = child.child('teach').val() ? '社課：' : '';
        display += child.child('name').val();
        $('#re-' + child.key).text(display);
      });
    });
  });
}

// Siwtch to new account page.
$('#ln-new-account').click(function() {
  $('#login input').val('');
  $('#login .message').text('');
  $('#login').animate({ left: "-=400px" }, 200);
  $('#new-account').animate({ left: "-=400px" }, 200);
});

// Switch to login page
$('#na-back-login').click(function() {
  $('#new-account input').val('');
  $('#new-account .message').text('');
  $('#login').animate({ left: "+=400px" }, 200);
  $('#new-account').animate({ left: "+=400px" }, 200);
});

// Create new account.
$('#na-new-account').click(function() {
  $('.message').text('');
  var name = $('#na-name').val();
  var id = $('#na-id').val();
  var card = $('#na-card').val();
  var password = $('#na-password').val();
  var email = $('#na-email').val();

  if (name.length == 0 || name.trim().length == 0) {
    $('#na-name-message').text('請輸入名字');
    $('#na-name').focus();
    return;
  }
  if (id.length == 0 || id.trim().length == 0) {
    $('#na-id-message').text('請輸入學號');
    $('#na-id').focus();
    return;
  }
  if (card.length == 0 || card.trim().length == 0) {
    $('#na-card-message').text('請輸入磁卡編號');
    $('#na-card').focus();
    return;
  }
  if (email.length == 0 || email.trim().length == 0) {
    $('#na-email-message').text('請輸入信箱');
    $('#na-email').focus();
    return;
  }

  // Loading animate.
  $('#loading').css('background-color', 'rgba(0, 0, 0, 0)').show().animate({
    'background-color' : 'rgba(0, 0, 0, 0.6)'
  }, 1000);

  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(users) {
    // Create account in database.
    firebase.database().ref('users/' + users.uid + '/info').set({
      name: name, id: id, card: card
    }, function(error) {
      $('#loading').hide();
      if (error) {
        alert('#Error171\n' + error.code + '\n' + error.message);
      } else {
        $('#ln-email').val($('#na-email').val());
        $('#new-account input').val('');
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
      default: alert('Error#264\n' + error.code + '\n' + error.message);
    }
  });
});

$('.re-switchweek').click(function() {
  var offset = (this.id === 're-nextweek' ? 7 : -7);

  switch ($('#re-week').text()) {
    case '本週': break;
    case '下週': offset += 7; break;
    case '下下週': offset += 14; break;
    default: alert('Error#276');
  }

  var room = 1;
  if ($('#re-room2').is(":disabled")) {
    room = 2;
  } else if ($('#re-room3').is(":disabled")) {
    room = 3;
  }

  initDate(offset);
  listenToReserveData(offset, room);
})

$('.re-room').click(function() {
  var offset;
  switch ($('#re-week').text()) {
    case '下週': offset = 7; break;
    case '下下週': offset = 14; break;
    default: offset = 0;
  }
  listenToReserveData(offset, parseInt(this.id.slice(7, 8)));
});

function showPopUp(x, y, title, message1, message2, status, time) {
  $('#p-title').text(title);
  $('#p-message1').text(message1);
  $('#p-message2').text(message2);
  $('#p-ok').off('click');
  $('#p-teach').off('click');
  if (status == 'RESERVE') {
    $('#p-teach').show();
    $('#p-teach').click(function() {
      reserve(time, true);
    });
    $('#p-ok').click(function() {
      reserve(time);
    });
  } else {
    $('#p-teach').hide();
    $('#p-ok').click(function() {
      cancelReserve(time);
    });
  }
  $('.popup').show();
  $('#p-container').css({ left: x, top: y });
}

$('#popup').click(function() {
  $('#p-container').animate({ "border-color": "#f20" }, 60);
  $('#p-container').animate({ "border-color": "#888" }, 60);
  $('#p-container').animate({ "border-color": "#f20" }, 60);
  $('#p-container').animate({ "border-color": "rgba(120, 120, 120, 0.9)" }, 60);
});

$('#p-container').click(function(e) { e.stopPropagation(); });

$('#account').click(function(e) { e.stopPropagation(); });

$('body').click(function() { $('#account').hide(); });

$('#p-cancel').click(function() { $('.popup').hide(); });

function reserve(time, teach) {
  $('#p-container button').prop('disabled', true);
  // Update these data simultaneously:
  //   users/<uid>/reserved/time<n>
  //   users/<uid>/reserved/count
  //   <room>/<week>/times/<time>
  var data = {};
  var info = {
    time: time,
    room: listenData.room
  };
  data['users/' + account.firebaseId + '/reserved/' + listenData.week + '/times/' + (counter + 1)] = info;
  data['users/' + account.firebaseId + '/reserved/' + listenData.week + '/count'] = counter + 1;
  if (listenData.count === 0) {
    data[listenData.room + '/' + listenData.week + '/number'] = listenData.week;
  }
  data[listenData.room + '/' + listenData.week + '/times/' + time] = teach ? {
    name: account.name,
    count: counter + 1,
    teach: true
  } : {
    name: account.name,
    count: counter + 1
  };

  $('.p-ani').show();
  firebase.database().ref().update(data, function(error) {
    if (error) {
      alert('#Error366\n' + error.code + '\n' + error.message);
    } else {
      ++counter;
      reserveData[counter+''] = Object.assign({}, info);
    }
    $('.p-ani').hide();
    $('.popup').hide();
    $('#p-container button').prop('disabled', false);
  });
}

function cancelReserve(time) {
  $('#p-container button').prop('disabled', true);
  var data = {};
  var info = {
    time: time,
    room: listenData.room
  };
  // Last data is the data that going to delete.
  var matchLast = reserveData[counter + ''].time === info.time &&
                  reserveData[counter + ''].room === info.room;

  var changeN, changeInfo;
  if (!matchLast) {
    changeN = Object.keys(reserveData).find(key => (reserveData[key].time == info.time &&
                                                    reserveData[key].room == info.room));
    changeInfo = reserveData[counter + ''];
    data['users/' + account.firebaseId + '/reserved/' + listenData.week + '/times/' + changeN] =
        Object.assign({}, changeInfo);
    data[changeInfo.room + '/' + listenData.week + '/times/' + changeInfo.time + '/count'] =
        parseInt(changeN);
  }
  if (listenData.count === 1) {
    data[listenData.room + '/' + listenData.week + '/number'] = null;
  }
  data[listenData.room + '/' + listenData.week + '/times/' + time] = null;

  data['users/' + account.firebaseId + '/reserved/' + listenData.week + '/times/' + counter] = null;
  data['users/' + account.firebaseId + '/reserved/' + listenData.week + '/count'] =
    counter - 1 == 0 ? null : counter - 1;

  $('.p-ani').show();
  firebase.database().ref().update(data, function(error) {
    if (error) {
      alert('#Error408\n' + error.code + '\n' + error.message);
    } else {
      if (!matchLast) {
        reserveData[changeN] = Object.assign({}, changeInfo);
      }
      reserveData[counter + ''] = null;
      --counter;
    }
    $('.p-ani').hide();
    $('.popup').hide();
    $('#p-container button').prop('disabled', false);
  });
}

$('.re-th').click(function(e) {
  if (loginDate.day === 0 && loginDate.hour < 8) {
    return;
  }
  if ($('#re-week').text() === '本週') {
    return;
  }
  var name = $(this).text();
  if (name.substring(0, 3) == '社課：') {
    name = name.substring(3, name.length);
  }

  if (name == '') {
    if (counter >= 7) {
      alert('預訂時段已達上限7次');
      return;
    }
    var x = e.pageX-122+"px", y = e.pageY-140+"px";
    var date = $('#re-' + this.id.slice(3, 6)).text(), time = parseInt(this.id.slice(7, 9));
    var message1 = '預訂琴房' + listenData.room + ' ' + date + ' ' + time + ':00~' + (time + 1) + ':00',
        message2 = '剩餘預定次數:' + (7 - counter);
    showPopUp(x, y, '預訂確認', message1, message2, 'RESERVE', this.id.slice(3, 9));
  } else if (name == account.name) {
    var x = e.pageX-122+"px", y = e.pageY-140+"px";
    var date = $('#re-' + this.id.slice(3, 6)).text(), time = parseInt(this.id.slice(7, 9));
    var message = '取消預訂琴房' + listenData.room + ' ' + date + ' ' + time + ':00~' + (time + 1) + ':00';
    showPopUp(x, y, '取消確認', message, '', 'CANCELRESERVE', this.id.slice(3, 9));
  }
});

$('#user').click(function(e) {
  e.stopPropagation();
  $('#account').show();
  $('#ac-name').text(account.name);
  $('#ac-email').text(account.email);
});

// Logout.
$('#ac-logout').click(function() {
  // Loading animate.
  $('#loading').css('background-color', 'rgba(0, 0, 0, 0)').show().animate({
    'background-color' : 'rgba(0, 0, 0, 0.6)'
  }, 1000);

  firebase.auth().signOut().then(function() {
    $('#loading').hide();
    $('#reserve').hide();
    $('#user').hide();
    $('#account').hide();
    clearTimeout(timer);
    $('#time').text('');
    $('#login-new-account').show();
    if (listener != null) {
      listener.off('value');
      listenData = {};
    }
  }, function(error) {
    $('#loading').hide();
    alert('Error#479');
  });
});

$('#ac-change-password').click(function() {
  var newPassword = prompt("輸入新密碼");


  if (newPassword != null) {
    var user = firebase.auth().currentUser;

    // Loading animate.
    $('#loading').css('background-color', 'rgba(0, 0, 0, 0)').show().animate({
      'background-color' : 'rgba(0, 0, 0, 0.6)'
    }, 1000);
    user.updatePassword(newPassword).then(function() {
      $('#loading').hide();
      alert('密碼更改成功');
    }).catch(function(error) {
      $('#loading').hide();
      switch (error.code) {
        case 'auth/weak-password': alert('更改失敗,密碼長度需至少6個字'); break;
        default: alert('Error#501\n' + error.code + '\n' + error.message);
      }
    });
  }
});

$(function() {
  firebase.database().ref('message').once('value', function(snapshot) {
    snapshot.forEach(function(child) {
      alert(child.val());
    });
  });
});