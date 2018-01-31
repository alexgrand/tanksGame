function game() {
  var html = document.querySelector('html');
  var canvas = document.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var width = 800;
  var height = 500;
  var directions = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
  
  allObs = [];
  var count = 0;
  var countShots = 0;

  var gameSettings = new GameSettings();

  canvas.width = width;
  canvas.height = height

  function GameSettings() {
    this.gameFinished = false;
    this.npcTanksAmount = 2;
    this.playerLife = 5;
    this.npcLife = 5;
    this.wallLife = 1;
  }
  GameSettings.prototype.checkGameOver = function () {
    var playerExists = false;
    for (var i = 0; i < allObs.length; i++) {
      var obs = allObs[i];
      if (obs.name.indexOf('playerTank')>-1) {
        playerExists = true;
      }
    }
    if (!playerExists) {
      this.gameFinished = true;
    }
  }

  function random(num) {
    return Math.floor(Math.random()*num);
  }

  // create custom Shape object
  function Shape(x,y,widthX,heightY) {
    this.x = x;
    this.y = y;
    this.widthX = widthX;
    this.heightY = heightY;
  }
  // draw Shape
  Shape.prototype.drawShape = function (color='black') {
    var objLeft = this.x;
    var objRight = this.x + this.widthX;
    var objTop = this.y;
    var objBottom = this.y + this.heightY;
    var objWidth = this.widthX;
    var objHeight = this.heightY;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(objLeft,objTop);
    ctx.lineTo(objRight,objTop);
    ctx.lineTo(objRight,objBottom);
    ctx.lineTo(objLeft,objBottom);
    ctx.closePath();
    ctx.stroke();

    if (this.name === 'playerTank' || this.name.indexOf('enemyTank')>-1) {
      if (this.dir === 'ArrowLeft') {
        ctx.moveTo(objLeft,objTop+objHeight/2);
        ctx.lineTo(objLeft-objWidth/2,objTop+objHeight/2);
      } else if (this.dir === 'ArrowRight') {
        ctx.moveTo(objRight,objTop+objHeight/2);
        ctx.lineTo(objRight+objWidth/2,objTop+objHeight/2);
      } else if (this.dir === 'ArrowUp') {
        ctx.moveTo(objLeft+objWidth/2,objTop);
        ctx.lineTo(objLeft+objWidth/2,objTop-objHeight/2);
      } else if (this.dir === 'ArrowDown') {
        ctx.moveTo(objLeft+objWidth/2,objBottom);
        ctx.lineTo(objLeft+objWidth/2,objBottom+objHeight/2);
      }
    } else {
      ctx.stroke();
    }
    ctx.stroke();
  }

  //  create Obstacles 
  function Obstacles(name,destroyable,x,y,widthX,heightY,life) {
    Shape.call(this,x,y,widthX,heightY);

    this.life = life;
    this.name = name;
    this.destroyable = destroyable;
  }
  Obstacles.prototype = Object.create(Shape.prototype);
  Obstacles.prototype.constructor = Obstacles;

  // check obs if it can be destroyed by parametr obj
  Obstacles.prototype.canBeDestroyedBy = function (obj) {
    var tankName = obj.parent.name;
    if (this.destroyable) {
      if (this.name.indexOf('playerTank')>-1) {
        return true;
      } else {
        if (tankName.indexOf('enemyTank')>-1) {
          return false;
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }

  Obstacles.prototype.turnAround = function (obj) {
    var antiDirections = ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'];
    if (this.name === obj.obsTouch) {
      // tanks can turn around if u fire on them
      if (this.name.indexOf('enemyTank')>-1) {
        for (var y = 0; y < directions.length; y++) {
          if (obj.dir === directions[y]) {
            this.dir = antiDirections[y];
          }
        }
      }
    }
  };

  // create Custom Tank
  function Tank (name,destroyable,x,y,widthX,heightY,life) {
    Obstacles.call(this,name,destroyable,x,y,widthX,heightY,life);

    var _this = this;
    this.moveX = 5; //tank speed
    this.moveY = 5;
    this.dir = directions[random(4)];
    this.canShoot = false;
    this.obsTouch = '';
    this.permMove = true;
    this.actions = [
      function () {
      _this.x -= _this.moveX;
      },
      function () {
        _this.x +=_this.moveX;
      },
      function () {
        _this.y -= _this.moveY;
      },
      function () {
        _this.y += _this.moveY;
      }
    ];
  }
  Tank.prototype = Object.create(Obstacles.prototype);
  Tank.prototype.constructor = Tank;

    // Tank obstacle detect
    Tank.prototype.obsDetect = function () {
      var objLeft = this.x;
      var objRight = this.x + this.widthX;
      var objTop = this.y;
      var objBottom = this.y + this.heightY;

      // creating new arr of obs without obstacle-object that called obsDetect method
      var blocks = [];
      for (var z = 0; z < allObs.length; z++) {
        if (this.name != allObs[z].name) {
          blocks.push(allObs[z]);
        }
      }
      for (var i = 0; i < blocks.length; i++) {
        var obs = blocks[i];
        var obsLeft = obs.x;
        var obsRight = obs.x+ obs.widthX;
        var obsTop = obs.y;
        var obsBottom = obs.y+obs.heightY;
        var frameDenyMove = [objLeft<=obsLeft,objRight>=obsRight,objTop<=obsTop,objBottom>=obsBottom];
        var obsDenyMove = [
          objLeft<=obsRight&&objLeft>=obsLeft&&(objTop>=obsTop&&objTop<obsBottom||objBottom>obsTop&&objBottom<obsBottom),
          objRight>=obsLeft&&objRight<=obsRight&&(objTop>=obsTop&&objTop<obsBottom||objBottom>obsTop&&objBottom<obsBottom),
          objTop<=obsBottom&&objTop>=obsTop&&(objLeft>=obsLeft&&objLeft<obsRight||objRight>obsLeft&&objRight<obsRight),
          objBottom>=obsTop&&objBottom<=obsBottom&&(objLeft>=obsLeft&&objLeft<obsRight||objRight>obsLeft&&objRight<obsRight)
        ];
        for (var y = 0; y < directions.length; y++) {
          if (this.dir === directions[y] && obs.name === 'frame') {
            if (frameDenyMove[y]) {
              return false;
            }
          } else if (this.dir === directions[y] && obs.name != 'frame') {
            if (obsDenyMove[y]) {
              this.obsTouch = obs.name;
              return false;
            } 
          }
        }
      }
      return true;
    };

    //set distances from tank gun to obs 
    Tank.prototype.onFireDist = function () {
      var _this = this;
      var blocks = [];
      var distances = [];
      var obsDist = [
        function () {
          return _this.x-(obs.x+obs.widthX);
        },
        function () {
          return obs.x -(_this.x+_this.widthX);
        },
        function () {
          return _this.y -(obs.y+obs.heightY);
        },
        function () {
          return obs.y - (_this.y+_this.heightY);
        }
      ];
      var obsOnFireLine = [
        function () {
          if (_this.y+_this.heightY/2>=obs.y && _this.y+_this.heightY/2<=obs.y+obs.heightY && obsDist[0]()>=0) {
            return obsDist[0]();
          } else {
            return false;
          }
        },
        function () {
          if (_this.y+_this.heightY/2>=obs.y && _this.y+_this.heightY/2<=obs.y+obs.heightY && obsDist[1]()>=0) {
            return obsDist[1]();
          } else {
            return false;
          }
        },
        function () {
          if (_this.x+_this.widthX/2>=obs.x && _this.x+_this.widthX/2<=obs.x+obs.widthX && obsDist[2]()>=0) {
            return obsDist[2]();
          } else {
            return false;
          }
        },
        function () {
          if (_this.x+_this.widthX/2>=obs.x && _this.x+_this.widthX/2<=obs.x+obs.widthX && obsDist[3]()>=0) {
            return obsDist[3]();
          } else {
            return false;
          }
        }
      ];

      for (var i = 0; i < allObs.length; i++) {
        if (this.name !== allObs[i].name && allObs[i].name !== 'frame') {
          blocks.push(allObs[i]);
        }
      }

      for (var y = 0; y < blocks.length; y++) {
        var obs = blocks[y];
        for (var z = 0; z < directions.length; z++) {
          if (this.dir === directions[z]) {
            distances[y] = {name:obs.name,obsDist: obsOnFireLine[z]()};
          }
        }
      }
      return distances;
    }

    // set keypad controls and enemyTank direction
    Tank.prototype.setControls = function () {
      var _this = this;
      if (_this.name.indexOf('playerTank')>-1) {
        html.addEventListener('keydown',function (e) {
          if (e.key === 'Control') {
            _this.permShoot();
          } else {
            for (var i = 0; i < directions.length; i++) {
              if (e.key === directions[i]) {
                _this.dir = e.key;
                _this.move();
              }
            }
          }
        });
      } 
    }

    Tank.prototype.move = function () {
      for (var i = 0; i < directions.length; i++) {
        if (this.dir === directions[i]) {
          if (this.player) { // if tank is player
            if (this.obsDetect()) {
            this.actions[i]();
            }
          } else { // if tank is nonPlayer
            if (this.obsDetect()) {
              this.actions[i]();
              count ++;
              if (count>=300) { // distance of move for NPC
                this.dir = directions[random(4)];
                count = 0;
              }
            } else {
              if (this.name.indexOf('enemyTank')>-1) {
                this.dir = directions[random(4)];
              }
            }
          }
        }
      } 
    }

    Tank.prototype.permShoot = function () {
      if (this.name === 'playerTank') {
        this.canShoot = true;
        this.createShot();
      } else {
        var playerTank = false;
        var hasObs = [];
        var distances = this.onFireDist();
        this.canShoot = false;
        for (var i = 0; i < distances.length; i++) {
          if (distances[i].name.indexOf('playerTank')>-1 && distances[i].obsDist) {
            playerTank = distances[i];
            distances.splice(i,1);
          } else if (distances[i].obsDist) {
            hasObs.push(distances[i]);
          }
        }
        // if there are no obs on fire line and only Player
        if (playerTank && hasObs.length === 0) {
          this.canShoot = true;
        // of there are obs on fire line and player
        } else if (playerTank && hasObs.length >0) {
          for (var z = 0; z < hasObs.length; z++) {
            if (playerTank.obsDist<hasObs[z].obsDist) {
              this.canShoot = true;
            }
          }
        }
        this.createShot();
      }
    }

    Tank.prototype.createShot = function () {
      var shot = {};
      var name = 'shot'+countShots;
      var dir = this.dir;
      var shotData = [
        {x:this.x-2,y:this.y+this.heightY/2,width:this.widthX/2,height:0.25},
        {x:this.x+this.widthX+2,y:this.y+this.heightY/2,width:this.widthX/2,height:0.25},
        {x:this.x+this.widthX/2,y:this.y-2,width:0.25,height:this.heightY/2},
        {x:this.x+this.widthX/2,y:this.y+this.heightY+2,width:0.25,height:this.heightY/2}
      ];

      if (this.canShoot) {
        for (var i = 0; i < directions.length; i++) {
          if (this.dir === directions[i]) {
            shot = new Shot(name,this,true,shotData[i].x,shotData[i].y,shotData[i].width,shotData[i].height,dir);
            allObs.push(shot);
            countShots++;
          }
        }
      }
      this.canShoot = false;
    }

    Tank.prototype.fire = function () {
      if (this.name.indexOf('enemyTank')>-1) {
        this.permShoot();
      }
      for (var i = 0; i < allObs.length; i++) {
        if (allObs[i].name.indexOf('shot')>-1) {
          var shot = allObs[i];
          if (shot.obsDetect() && shot.permMove) {
            for (var y = 0; y < directions.length; y++) {
              if (shot.dir === directions[y]) {
                shot.actions[y]();
                shot.drawShot();
              }
            }
          } else { // if obs found it wil be destroyed and Shot object dissapear
            shot.destroyObs();
          }
        }
      }
    }

  //  create oject of Shot line
  function Shot(name,parent,destroyable,x,y,widthX,heightY,dir) {
    Tank.call(this,name,destroyable,x,y);
    this.parent = parent;
    this.widthX = widthX;
    this.heightY = heightY;
    this.dir = dir;
    this.moveX = 1; //shot speed
    this.moveY = 1;
  }
    Shot.prototype = Object.create(Tank.prototype);
    Shot.prototype.constructor = Shot;
    // draw shot line
    Shot.prototype.drawShot = function () {
      var objLeft = this.x;
      var objRight = this.x + this.widthX;
      var objTop = this.y;
      var objBottom = this.y + this.heightY;
      var objWidth = this.widthX;
      var objHeight = this.heightY;
      var color = 'red';

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.moveTo(objLeft,objTop);
      ctx.lineTo(objRight,objTop);
      ctx.lineTo(objRight,objBottom);
      ctx.lineTo(objLeft,objBottom);
      ctx.closePath();
      ctx.stroke();
    }
    // destroy obstacle that underfire
    Shot.prototype.destroyObs = function () {
      var shot;
      var antiDirections = ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'];
      this.permMove = false; 
      // deleting object of Shot
      for (var i = 0; i < allObs.length; i++) {
        if (allObs[i].name === this.name) {
          shot = this;
          allObs.splice(i,1);
          delete this;
        }
      }
      // deleting object if it killed
      for (var z = 0; z < allObs.length; z++) {
        var obs = allObs[z];
        if (obs.canBeDestroyedBy(shot)) {
          if (obs.name === shot.obsTouch && obs.life<=0) {
            delete obs;
            allObs.splice(z,1);
          } else if (obs.name === shot.obsTouch) {
            // tanks can turn around if u fire on them
            obs.turnAround(shot);
            obs.life--;
          }
        }
      }
    }

  // creating Objects
  function createObjects() {
    // create Obstacles
    frame = new Obstacles('frame',false, 0,0,width,height);
    obs1 = new Obstacles('wall0',true, 100,70,50,50,gameSettings.wallLife);
    obs2 = new Obstacles('wall1',true,200,200,20,20,gameSettings.wallLife);
    obs3 = new Obstacles('wall2',true,200,240,20,20,gameSettings.wallLife);
    obs4 = new Obstacles('wall3',true,220,200,20,20,gameSettings.wallLife);
    obs5 = new Obstacles('wall4',true,340,300,20,20,gameSettings.wallLife);


    // create Player Tank
    playerTank = new Tank('playerTank',true,170,130,20,20,gameSettings.playerLife);

    enemyTank1 = new Tank('enemyTank1',true,0,200,20,20,gameSettings.npcLife);
    enemyTank1.moveX = 0.5;
    enemyTank1.moveY = 0.5;

    enemyTank2 = new Tank('enemyTank2',true,300,20,20,20,gameSettings.npcLife);
    enemyTank2.moveX = 0.5;
    enemyTank2.moveY = 0.5;

    playerTank.setControls();

    allObs.push(frame,obs1,obs2,obs3,obs4,obs5,playerTank,enemyTank1,enemyTank2);
  }

  /* creating animation */ 
  function loop() {
    // renewing canvas for drawing again and again
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,width,height);
    frame.drawShape('black');

    if (!gameSettings.gameFinished) {
      for (var i = 0; i < allObs.length; i++) {
        var obs = allObs[i];
        if (obs) {
          if (obs.name.indexOf('wall')>-1) {
            obs.drawShape('pink');
          } else if (obs.name.indexOf('enemyTank')>-1) {
            obs.drawShape('blue');
            obs.move();
            obs.fire();
          } else if (obs.name === 'playerTank') {
            obs.drawShape('red');
            obs.fire();
          }
        }
      }

      gameSettings.checkGameOver();
      requestAnimationFrame(loop);
    } else {
      ctx.font = '48px serif';
      ctx.fillStyle = 'Black';
      ctx.fillText('Game Over',canvas.width/2-100, 50);
    }
  }

  createObjects();
  loop(); 
};
game();