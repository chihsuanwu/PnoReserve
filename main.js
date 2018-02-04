// Firebase data.
var database = firebase.database();

// Login
$('#ln-btn-login').click(function() {
  id = $('#ln-id').val();
  password = $('#ln-password').val();
  if (id.length == 0 || id.trim().length == 0) {
    alert('請輸入學號');
    return;
  }
  firebase.database().ref('accounts').once('value', function(snapshot) {
    if (snapshot.hasChild(id)) {
      if (password == snapshot.child(id).val().password) {
        name = snapshot.child(id).val().name;
        alert(name + '/'+ id + '登入成功');
      } else {
        alert('密碼錯誤');
      }
    } else {
      alert('無此帳號');
    }
  });
})

// Siwtch to new account page.
$('#ln-btn-new-account').click(function() {
  $('#login').hide();
  $('#new-account').show();
})

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