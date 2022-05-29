   'use strict';


(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

    var Game = {};
  var canvas, context;
  Game.params = {};
  Game.params.color = '#fff';
  Game.params.requestID = null;
  
  Game.resetParams = function () {
    // empty arrays
    Game.setupShip.teleportArray = new Array();
    Game.setupShip.bulletArray = new Array();
    Game.setupShip.effectArray = new Array();
    Game.setupEnemy.array = new Array();
    Game.setupEnemy.bulletArray = new Array();
    Game.setupEnemy.effectArray = new Array();
    Game.setupEnemy.hitEffectArray = new Array();
    Game.setupAsteroid.array = new Array();
    // reset timer
    Game.setupAsteroid.loop = 0;
    Game.setupAsteroid.count = 0;
    // reset color
    Game.params.color = '#fff';
  }
  Game.setParams = function () {
    Game.params.keyList = new Array();
    Game.params.cx = 0;
    Game.params.cy = 0;
    Game.params.score = 0;
    Game.params.totalScore = 0;
  }
  Game.setupCanvas = function () {
    canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context = canvas.getContext('2d');
    Game.params.cx = canvas.width / 2;
    Game.params.cy = canvas.height / 2;
  }
  
  Game.clearCanvas = function (context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
  }
  Game.setupShip = {
    x: 0,
    y: 0,
    deltaAngle: 0,
    angle: 0,
    vel: 2,
    radius: 10
  };
  
  Game.setupShip.init = function () {
    Game.setupShip.x = Game.params.cx;
    Game.setupShip.y = Game.params.cy;
    Game.setupShip.hitpoints = 5;
    Game.setupShip.damaged = false;
    Game.setupShip.damageCounter = 0;
    Game.setupShip.alpha = 1;
    Game.setupShip.alphaState = false;
    displayMessage('Thrust ready...');
  };
  
  Game.setupShip.view = function (ctx) {
    // draw the ship
    ctx.save();
    ctx.beginPath();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(Game.setupShip.x, Game.setupShip.y);
    ctx.rotate(degToRad(Game.setupShip.angle));
    ctx.moveTo(-15, -15);
    ctx.lineTo(15, 0);
    ctx.lineTo(-15, 15);
    ctx.lineTo(0, 0);
    ctx.lineTo(-15, -15);
    
    if (Game.params.keyList[38] === true) {
      ctx.moveTo(-20, 0);
      ctx.lineTo(-10, 0);
      ctx.moveTo(-10, -5);
      ctx.lineTo(-10, 5);
    }
    
    // animation upon hit, ship will blink
    var G = Game.setupShip;
    if (G.damaged == true) {
      G.damageCounter += 60 / 1000;
      if (G.alpha > 0.05) {
        if (G.alphaState == false) {
          G.alpha -= 0.05;
        }
      } else {
        G.alphaState = true;
      }
      if (G.alphaState == true) {
        G.alpha += 0.05;
        if (G.alpha > 0.95) G.alphaState = false;
      }
      if (G.damageCounter > 8) {
        G.damageCounter = 0;
        G.damaged = false;
        G.alpha = 1;
        if (G.hitpoints <= 0) {
          displayMessage('Oh uh...');
          gameState('GAME OVER');
        }
      }
    }
    ctx.globalAlpha = G.alpha;
    ctx.strokeStyle = Game.params.color;
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };
  
  Game.setupShip.control = function (evt) {
    var key = evt.keyCode;
    Game.params.keyList[key] = true;
    switch (key) {
      case 37: Game.setupShip.deltaAngle = 1; Game.params.keyList[39] = false; break;
      case 38: Game.setupShip.vel = 2; Game.params.keyList[40] = false;
      break;
      case 39: Game.setupShip.deltaAngle = 1; Game.params.keyList[37] = false; break;
      case 16: displayMessage('opening wormhole...'); Game.setupShip.teleport(); break;
      case 32: displayMessage('piu piu piu...'); Game.setupShip.bullet(); break;
      default: return;
    }
  }
  
  Game.setupShip.logic = function () {
    var s = Game.setupShip;
    checkBoundary(s);
    
    if (Game.params.keyList[38] === true) {
      s.vel *= .975;
      s.x += s.vel * cos(s.angle);
      s.y += s.vel * sin(s.angle);
      if (s.vel < .5) {
        Game.params.keyList[38] = false;
      }
    }
    if (Game.params.keyList[37] === true) {
      s.deltaAngle *= .95;
      s.angle -= s.deltaAngle;
    }
    if (Game.params.keyList[39] === true) {
      s.deltaAngle *= .95;
      s.angle += s.deltaAngle;
    }
    
    if (Game.params.keyList[40] == true) {
      if (s.vel > 0) {
        s.vel *= .95;
      }
    }
  }
  
  Game.setupShip.teleportArray = new Array();
  Game.setupShip.teleport = function () { 
      var s = Game.setupShip;
      s.x = randomize(0, canvas.width);
      s.y = randomize(0, canvas.height);
    for (var i = 0; i < 12; i += 1) {
      var t = {};
      t.x = s.x + 20 * cos(i * 30);
      t.y = s.y + 20 * sin(i * 30);
      t.vel = 0.5;
      t.angle = i * 30;
      t.radius = 1.5;
      s.teleportArray.push(t);
    }
  }
  
  Game.setupShip.teleportDraw = function () {
    // teleport animation
    for (var i = 0; i < Game.setupShip.teleportArray.length; i += 1) {
      var t = Game.setupShip.teleportArray[i];
        t.x -= t.vel * cos(t.angle);
        t.y -= t.vel * sin(t.angle);
      if (t.radius > 0.5) {
        t.radius -= 0.03;
      } else {
        Game.setupShip.teleportArray.length = 0;
      }
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(t.x, t.y, t.radius, 0, Math.PI * 2, false);
      context.fillStyle = Game.params.color;
      context.fill();
      context.closePath();
      context.restore();
    }
  }
  
  Game.setupShip.bulletArray = new Array();
  Game.setupShip.bullet = function () {
    var s = Game.setupShip;
    var b = {};
      b.x = s.x + 15 * cos(s.angle);
      b.y = s.y + 15 * sin(s.angle);
      b.vel = 2;
      b.radius = 1.5;
      b.angle = s.angle;
      if (s.bulletArray.length < 6) s.bulletArray.push(b);
  }
  Game.setupShip.bulletDraw = function () {
    for (var i = 0; i < Game.setupShip.bulletArray.length; i += 1) {
      var b = Game.setupShip.bulletArray[i];
        b.x += b.vel * cos(b.angle);
        b.y += b.vel * sin(b.angle);
      
      if (b.radius > .5) {
        b.radius -= .01;
      } else {
        Game.setupShip.bulletArray.shift();
      }
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(b.x, b.y, b.radius, 0, Math.PI * 2, false);
      context.fillStyle = Game.params.color;
      context.fill();
      context.closePath();
      context.restore();
    }
  }
  
  Game.setupShip.effectArray = new Array();
  Game.setupShip.effect = function (param) {
    for (var i = 0; i < 6; i += 1) {
      var e = {};
        e.x = param.x;
        e.y = param.y;
        e.vel = 1;
        e.radius = 1;
        e.angle = param.angle + 90 + (i * 30);
      Game.setupShip.effectArray.push(e); 
    }
  }
  Game.setupShip.effectDraw = function () {
    var G = Game.setupShip;
    for (var i = 0; i < G.effectArray.length; i += 1) {
      var e = G.effectArray[i];
        e.x += e.vel * cos(e.angle);
        e.y += e.vel * sin(e.angle);
        
      if (e.radius > 0.5) {
        e.radius -= .05;
      } else {
        G.effectArray.length = 0;
      }
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(e.x, e.y, e.radius, 0, Math.PI * 2, false);
      context.fillStyle = Game.params.color;
      context.fill();
      context.closePath();
      context.restore();
    }
  }
  
  Game.setupEnemy = {};
  Game.setupEnemy.array = new Array();
  Game.setupEnemy.init = function () {
    var e = {};
    e.x = randomize(0, canvas.width);
    e.y = randomize(0, canvas.height);
    e.angle = randomize(0, 360);
    e.countdown = 0;
    e.damaged = false;
    e.damageCounter = 0;
    e.alpha = 1;
    e.alphaState = false;
    e.hitpoints = 5;
    e.vel = 2;
    e.radius = 15;
    Game.setupEnemy.array.push(e);
  }
  Game.setupEnemy.reset = function () {
    var e = Game.setupEnemy.array[0];
      e.x = randomize(0, canvas.width);
      e.y = randomize(0, canvas.height);
      e.vel = 2;
      e.angle = randomize(0, 360);
      e.countdown = 0;
  }
  Game.setupEnemy.draw = function () {
    var e = Game.setupEnemy;
    if (e.array.length > 0) {
      var E = Game.setupEnemy.array[0];
        E.vel *= .985;
        E.x += E.vel * cos(E.angle);
        E.y += E.vel * sin(E.angle);
        E.countdown += 60 / 1000;
        if (E.countdown > 6) {
          e.effect();
          e.reset();
          if (e.bulletArray.length < 5) {
            e.bullet();
          } else {
            e.bulletArray.length = 0;
          }
        } 
      
      checkBoundary(E);
      
      var S = Game.setupShip;
      
      // check collision with ship
      if (checkOverlap(S, E) === true) {
        S.hitpoints -= 1;
        S.damaged = true;
      }
      
      // check collision with ship bullet 
      for (var i = 0; i < S.bulletArray.length; i += 1) {
        var b = S.bulletArray[i];
        if (checkOverlap(b, E) === true) {
          S.bulletArray.splice(i, 1);
          E.damaged = true;
          E.hitpoints -= 1;
        }
      }
      
      // animation upon hit, ship will blink
      if (E.damaged === true) {
        E.damageCounter += 60 / 1000;
        if (E.alpha > 0.05) {
          if (E.alphaState == false) {
            E.alpha -= 0.05;
          }
        } else {
          E.alphaState = true;
        }
        if (E.alphaState == true) {
          E.alpha += 0.05;
          if (E.alpha > 0.95) E.alphaState = false;
        }
        if (E.damageCounter > 8) {
          E.damageCounter = 0;
          E.damaged = false;
          E.alpha = 1;
          if (E.hitpoints < 1) {
            // ship is destroyed...
            Game.params.score += 50;
            displayScore(Game.params.score, Game.params.totalScore);
            displayMessage('Wohoo...');
            Game.setupEnemy.array.length = 0;
            if (Game.params.score === Game.params.totalScore) {
              gameState('PERFECT');
            }
          }
        }
      }
      
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(E.x, E.y);
      context.rotate(0);
      context.moveTo(-20, -3);
      context.bezierCurveTo(-20, -15, 20, -15, 20, -3);
      context.lineTo(-20, -3);
      context.lineTo(-20, 0);
      context.lineTo(20, 0);
      context.lineTo(20, -3);
      context.moveTo(20, 0);
      context.lineTo(30, 5);
      context.lineTo(-30, 5);
      context.lineTo(-20, 0);
      context.moveTo(15, 5);
      context.lineTo(18, 10);;
      context.moveTo(-15, 5);
      context.lineTo(-18, 10);
      context.globalAlpha = E.alpha;
      context.strokeStyle = Game.params.color;
      context.stroke();
      context.closePath();
      context.restore();
    }
  }
  Game.setupEnemy.bulletArray = new Array();
  Game.setupEnemy.bullet = function () {
    var E = Game.setupEnemy;
    var e = Game.setupEnemy.array[0];
    var S = Game.setupShip;
    var b = {};
      b.x = e.x;
      b.y = e.y;
      b.vel = 2;
      b.radius = 1;
      b.angle = checkAngle(e, S);
      E.bulletArray.push(b);
  }
  Game.setupEnemy.bulletDraw = function () {
    var S = Game.setupShip;
    var b = Game.setupEnemy.bulletArray;
    if (b.length > 0) {
      var B = b[0];
        B.x -= B.vel * cos(B.angle);
        B.y -= B.vel * sin(B.angle);
      
      // check if the enemy's bullet hit the ship
      if (checkOverlap(B, S)) {
        displayMessage('You have been hit!');
        b.splice(0, 1); // remove the bullet
        S.damaged = true;
        Game.setupEnemy.hitEffect(B);
        S.hitpoints -= 1;
      }
      
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(B.x, B.y, B.radius, 0, Math.PI * 2, false);
      context.fillStyle = Game.params.color;
      context.fill();
      context.closePath();
      context.restore();
    }
  }
   
  Game.setupEnemy.effectArray = new Array();
  Game.setupEnemy.effect = function () {
    var E = Game.setupEnemy;
    var S = Game.setupEnemy.array[0];
    for (var i = 0; i < 12; i += 1) {
      var e = {};
        e.x = S.x + 20 * cos(i * 30);
        e.y = S.y + 20 * sin(i * 30);
        e.vel = 1;
        e.radius = 1.5;
        e.angle = i * 30;
        E.effectArray.push(e);
    }
  }
  Game.setupEnemy.effectDraw = function () {
    for (var i = 0; i < Game.setupEnemy.effectArray.length; i += 1) {
      var e = Game.setupEnemy.effectArray[i];
        e.x -= e.vel * cos(e.angle);
        e.y -= e.vel * sin(e.angle);
      
      if (e.radius > 0.5) {
        e.radius -= 0.05;
      } else {
        Game.setupEnemy.effectArray.length = 0;
      }
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(e.x, e.y, e.radius, 0, Math.PI * 2, false);
      context.fillStyle = Game.params.color;
      context.fill();
      context.closePath();
      context.restore();
        
    }
  }
  
  Game.setupEnemy.hitEffectArray = new Array();
  Game.setupEnemy.hitEffect = function (param) {
    var h = {};
      h.x = param.x;
      h.y = param.y;
      h.radius = 1;
      h.radius = 0;
    Game.setupEnemy.hitEffectArray.push(h); 
  }
  
  Game.setupEnemy.hitEffectDraw = function () {
    var H = Game.setupEnemy;
    if (H.hitEffectArray.length > 0) {
      var h = H.hitEffectArray[0];
      
      if (h.radius < 10) {
        h.radius += 0.5;
      } else {
        H.hitEffectArray.length = 0;
      }
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(h.x, h.y, h.radius, 0, Math.PI * 2, false);
      context.strokeStyle = Game.params.color;
      context.stroke();
      context.closePath();
      context.restore();
    }
  }
  Game.setupAsteroid = {};
  Game.setupAsteroid.loop = 0;
  Game.setupAsteroid.count = 0;
  Game.setupAsteroid.array = new Array();
  Game.setupAsteroid.relocate = true;
  Game.setupAsteroid.create = function () {
    var A = {};
      A.x = randomize(0, canvas.width);
      A.y = randomize(0, canvas.height);
      A.vel = randomize(0, 10) / 20;
      A.radius = randomize(20, 20);
      A.angle = randomize(0, 360);
      A.hitpoints = Math.floor(A.radius * 2 / 10);
    return A;
  }
  Game.setupAsteroid.init = function () {
    var A = Game.setupAsteroid;
    
    var a = A.create();
    A.array.push(a);
    for (var i = 0; i < 15; i += 1) {
      A.recreate();
    }
    
    for (var j = 0; j < A.array.length; j += 1) {
      var a = A.array[j];
      Game.params.totalScore += Math.floor(a.radius * 5 / 10);
    }
    Game.params.totalScore += 50;
    displayScore(Game.params.score, Game.params.totalScore);
  }
  
  Game.setupAsteroid.recreate = function () {
    var A = Game.setupAsteroid;
    var neu = A.create();
    for (var j = 0; j < A.array.length; j += 1) {
      var alt = A.array[j];
      
      if (checkOverlap(neu, alt) == true) {
        A.count -= 1;
        A.relocate = true;
      } else {
        A.count += 1;
        A.relocate = false;
      }
      A.loop += 1;
    }
    if (A.relocate === false) {
      if (A.count === A.loop) {
        A.loop = 0;
        A.count = 0;
        A.array.push(neu);
      }
    } else {
      A.recreate();
    }
  }
  
  Game.setupAsteroid.draw = function () {
    var A = Game.setupAsteroid;
    var B = Game.setupShip;
    var C = Game.setupEnemy;
    for (var i = 0; i < A.array.length; i += 1) {
      var a = A.array[i];
        a.x += a.vel * cos(a.angle);
        a.y += a.vel * sin(a.angle);
        
      checkBoundary(a);
      
      // check collision with other asteroids
      for (var j = 0; j < A.array.length; j += 1) {
        var b = A.array[j];
        if (i !== j) {
          if (checkOverlap(a, b) === true) {
            var ax = v3costheta3(a, b);
            var ay = v3sintheta3(a, b);
            var bx = v4costheta4(a, b);
            var by = v4sintheta4(a, b);
      
            a.angle = arctan(ax, ay);
            b.angle = arctan(bx, by);
            
            a.vel = ax / cos(a.angle);
            b.vel = bx / cos(b.angle);
            
            a.x += a.vel * cos(a.angle);
            a.y += a.vel * sin(a.angle);
            b.x += b.vel * cos(b.angle);
            b.y += b.vel * sin(b.angle);
          }
        }
      }
      
      // check collision with your bullets
      for (var k = 0; k < B.bulletArray.length; k += 1) {
        var r = B.bulletArray[k];
        
        // bullet hits the asteroids
        if (checkOverlap(a, r) === true) {
          B.effect(r);
          B.bulletArray.splice(k, 1); // remove bullets upon hit
          a.hitpoints -= 1; // minus hitpoint of asteroid
          if (a.hitpoints === 0) {
            A.array.splice(i, 1);
            Game.params.score += Math.floor(a.radius * 5 / 10);
            displayMessage('Blasting rocks here')
            displayScore(Game.params.score, Game.params.totalScore);
            if (Game.params.score === Game.params.totalScore) {
              gameState('PERFECT');
            }
          }
        }
      }
      
      // check collision with enemy bullets 
      for (var l = 0; l < C.bulletArray.length; l += 1) {
        var m = C.bulletArray[l];
        
        if (checkOverlap(a, m) === true) {
          C.hitEffect(m);
          C.bulletArray.splice(l, 1);
          a.hitpoints -= 1;
          
          if (a.hitpoints === 0) {
            A.array.splice(i, 1);
          }
        }
      }
      // check collision with ship
      if (checkOverlap(a, B) === true) {
        B.hitpoints -= 1;
        B.damaged = true;
        displayMessage('You just hit an asteroid...');
      }
      
      
      context.save();
      context.beginPath();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(0, 0);
      context.rotate(0);
      context.arc(a.x, a.y, a.radius, 0, Math.PI * 2, false);
      context.strokeStyle = Game.params.color;
      context.stroke();
      context.closePath();
      context.restore();
    }
  }
  
  
  
  function log (message) {
    console.log(message);
  }
  
  function cos (degree) {
    return Math.cos(degree * Math.PI / 180);
  }
  
  function sin (degree) {
    return Math.sin(degree * Math.PI / 180);
  }
  
  function arctan (x, y) {
    return Math.atan2(y, x) * 180 / Math.PI;
  }
  
  function degToRad (degree) {
    return degree * Math.PI / 180;
  }
  
  function randomize (min, max) {
    return Math.floor(Math.random() * max) + min;
  }
  
  function checkAngle (p1, p2) {
    return Math.atan2((p1.y - p2.y), (p1.x - p2.x)) * 180 / Math.PI;
  }
  
  function checkOverlap (p1, p2) {
    var a = p1.x - p2.x;
    var b = p1.y - p2.y;
    var c = Math.sqrt(a * a + b * b);
    var d = p1.radius + p2.radius;
    if (c < d) {
      return true;
    } else {
      return false;
    }
  }
  
  function checkBoundary (p) {
    if (p.x > canvas.width) p.x = 0;
    if (p.x < 0) p.x = canvas.width;
    if (p.y > canvas.height) p.y = 0;
    if (p.y < 0) p.y = canvas.height;
  }
  
  function v3costheta3 (p1, p2) {
    return (p1.vel * cos(p1.angle) * (p1.radius - p2.radius) + 2 * p2.radius * p2.vel * cos(p2.angle)) / (p1.radius + p2.radius); 
  }
  
  function v3sintheta3 (p1, p2) {
    return (p1.vel * sin(p1.angle) * (p1.radius - p2.radius) + 2 * p2.radius * p2.vel * sin(p2.angle)) / (p1.radius + p2.radius); 
  }
  
  function v4costheta4 (p1, p2) {
    return (2 * p1.radius * p1.vel * cos(p1.angle) + p2.vel * cos(p2.angle) * (p2.radius - p1.radius)) / (p1.radius + p2.radius);
  }
  
  function v4sintheta4 (p1, p2) {
    return (2 * p1.radius * p1.vel * sin(p1.angle) + p2.vel * sin(p2.angle) * (p2.radius - p1.radius)) / (p1.radius + p2.radius);
  }
  
  function displayScore (score, totalScore) {
    $('#score').text(score + '/' + totalScore + ' Pts');
  }
  
  function displayMessage (message) {
    $('#message').text(message).css({
      'margin-left': -$('#message').width() / 2
    }).fadeIn(1000, function () {
      $(this).fadeOut(1500);
    });
  }
  
  function gameState (state) {
    switch (state) {
      case 'START': break;
      case 'GAME OVER': 
        Game.params.color = '#222';
        $('#start').text('GAME OVER').fadeIn(500, function () {
          displayMessage('Better luck next time...');
          cancelAnimationFrame(Game.params.requestID);
        });
        break;
      case 'PERFECT':
        Game.params.color = '#222';
        $('#start').text('PERFECT').fadeIn(500, function () {
          displayMessage('One word - gg');
          cancelAnimationFrame(Game.params.requestID);
        });     
      default: return; break;
    }
  }
  
  Game.init = function () {
    this.resetParams();
    this.setParams();
    this.setupCanvas();
    this.setupShip.init();
    this.setupEnemy.init();
    this.setupAsteroid.init();
    window.addEventListener('keydown', Game.setupShip.control, false);
    
    (function loop () {
      Game.clearCanvas(context, canvas);
      
      Game.setupShip.view(context);
      Game.setupShip.logic();
      Game.setupShip.teleportDraw();
      Game.setupShip.bulletDraw();
      Game.setupShip.effectDraw();
      
      Game.setupEnemy.draw();
      Game.setupEnemy.bulletDraw();
      Game.setupEnemy.effectDraw();
      Game.setupEnemy.hitEffectDraw();
    
      Game.setupAsteroid.draw();
      Game.params.requestID = requestAnimationFrame(loop);
    })();
  }
  
  $('#start')
    .css({'margin-top': -$('#start').height() / 2})
    .click(function () {
      $(this).fadeOut(500, function () {
        Game.init();
      });
    });
