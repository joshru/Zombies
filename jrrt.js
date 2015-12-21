// only change code in selectAction function()

function JRRT(game) {
    this.player = 1;
    this.radius = 10;
    this.rocks = 0;
    this.kills = 0;
    this.inPeril = false;
    this.name = "YOLO SWAG #420";
    this.color = "Cyan";
    this.cooldown = 0;
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2));

    this.velocity = { x: 0, y: 0 };
};

JRRT.prototype = new Entity();
JRRT.prototype.constructor = JRRT;

// alter the code in this function to create your agent
// you may check the state but do not change the state of these variables:
//    this.rocks
//    this.cooldown
//    this.x
//    this.y
//    this.velocity
//    this.game and any of its properties

// you may access a list of zombies from this.game.zombies
// you may access a list of rocks from this.game.rocks
// you may access a list of players from this.game.players

JRRT.prototype.selectAction = function () {

    var action = { direction: { x: 0, y: 0 }, throwRock: false, target: null};
    var rockSpeed = 200; //max speed of a thrown rock
    var acceleration = 1000000000;
    var closest = 100;
    var fastestZombie = 0;

    var target = null;
    this.visualRadius = 1000;
    this.fleeRadius = 80;


    // check nearby zombies and try to run from them
    for (var i = 0; i < this.game.zombies.length; i++) {
        var ent = this.game.zombies[i];
        //console.log("zombie x velocity: " + ent.velocity.x + " zombie y velocity: " + ent.velocity.y);
        var dist = distance(ent, this);

        if (dist < closest) {
            closest = dist;
            target = ent;

        }

        ////TODO fix or remove this
        //if (dist < 50 && this.rocks === 0) {
        //    this.inPeril = true;
        //    //console.log("This is the end!!");
        //}

        //console.log("closest zombie distance = " + closest);
        if (this.collide({x: ent.x, y: ent.y, radius: this.fleeRadius}) && !this.inCorner()) {
            var difX = (ent.x - this.x) / dist;
            var difY = (ent.y - this.y) / dist;
            action.direction.x -= difX * acceleration / (dist * dist);
            action.direction.y -= difY * acceleration / (dist * dist);
        }
    }
    for (var i = 0; i < this.game.rocks.length; i++) {
        var ent = this.game.rocks[i];
        if (!ent.removeFromWorld/* && !ent.thrown*/ && this.rocks < 2 && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            if (dist > this.radius + ent.radius) {
                var difX = (ent.x - this.x) / dist;
                var difY = (ent.y - this.y) / dist;
                action.direction.x += difX * acceleration / (dist * dist);
                action.direction.y += difY * acceleration / (dist * dist);
            }
        }
    }

    //trying to allow players to help other players... not successful (yet)

    //for (var i = 0; i < this.game.players.length; i++) {
    //    var player = this.game.players[i];
    //    if (player.inPeril && this.rocks > 1) {
    //        target = player; //if the player is being chased and has no rocks, help a brother out!
    //        console.log("I can be your hero bb");
    //    }
    //}

    if (this.inCorner()) {
        var corner = this.escapeCorners();
        action.direction.x -= corner.x * acceleration / Math.pow(corner.dist, 2);
        action.direction.y -= corner.y * acceleration / Math.pow(corner.dist, 2);
    }

    if (target) {
        action.target = this.zombieSnipe(target, target.velocity, this, rockSpeed);
        if (action.target != null) action.throwRock = true; //don't throw the rock if we don't have a target
    }


    return action;
};

// beautiful intercept function adapted from:
// http://jaran.de/goodbits/2011/07/17/calculating-an-intercept-course-to-a-target-with-constant-direction-and-velocity-in-a-2-dimensional-plane
//
JRRT.prototype.zombieSnipe = function(zombie, zVector, survivor, rockSpeed) {
    var xDiff = zombie.x - survivor.x;
    var yDiff = zombie.y - survivor.y;
    var h1 = Math.pow(zVector.x, 2) + Math.pow(zVector.y, 2) - Math.pow(rockSpeed, 2);
    var h2 = xDiff * zVector.x + yDiff * zVector.y;
    var t; //the amount of time it would take for the rock to hit a zombie
    if (h1 === 0) { //problem comllapses into a simple linear equation
        t = -(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) / 2 * h2;
    } else { //solve the quadratic equation
        var minusPHalf = -h2 / h1;
        var h3 = Math.pow(xDiff, 2) + Math.pow(yDiff, 2);
        var discriminant = Math.pow(minusPHalf, 2) - h3 / h1;

        if (discriminant < 0) { // no solution found
            return null;
        }
        var root = Math.sqrt(discriminant);
        var t1 = minusPHalf + root;
        var t2 = minusPHalf - root;

        var tMin = Math.min(t1, t2);
        var tMax = Math.max(t1, t2);

        t = tMin > 0 ? tMin : tMax; //gets the smallest positive time, better chance of hitting a zombie with low time
        if (t < 0) { //t < 0 would mean the rock hits the zombie in the past, we don't want this
            return null;
        }
    }
    //use the found time to calculate where the zombie will be when we throw our rock
    var x = zombie.x + t * zVector.x;
    var y = zombie.y + t * zVector.y;
    return {x: x, y: y};
};

JRRT.prototype.escapeCorners = function() {
    var center = {x: 400, y: 400};
    var distFromCenter = distance(this, center);

    //taking a hint from provided code here...
    var xDiff = (this.x - center.x) / distFromCenter;
    var yDiff = (this.y - center.y) / distFromCenter;
    return {x: xDiff, y: yDiff, dist: distFromCenter};
};

JRRT.prototype.inCorner = function() {
    var stuck = false;

    var upLeft  = {x: 50, y: 50};
    var lowLeft = {x: 50, y: 750};

    var upRight =  {x: 750, y: 50};
    var lowRight = {x: 750, y: 750};

    //check left corners
    if (this.x < upLeft.x && this.y < upLeft.y) {
        stuck = true;
        //console.log("stuck up left x: " + this.x + " y: " + this.y);
    }
    if (this.x < lowLeft.x && this.y > lowLeft.y) {
        stuck = true;
        //console.log("stuck low left x: " + this.x + " y: " + this.y);
    }

    //check right corners
    if (this.x > upRight.x && this.y < upRight.y) {
        stuck = true;
        //console.log("stuck up right x: " + this.x + " y: " + this.y);
    }
    if (this.x > lowRight.x && this.y > lowRight.y) {
        stuck = true;
        //console.log("stuck low right x: " + this.x + " y: " + this.y);
    }

    return stuck;
};

// do not change code beyond this point

JRRT.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

JRRT.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

JRRT.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

JRRT.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

JRRT.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

JRRT.prototype.update = function () {
    Entity.prototype.update.call(this);
    // console.log(this.velocity);
    if (this.cooldown > 0) this.cooldown -= this.game.clockTick;
    if (this.cooldown < 0) this.cooldown = 0;
    this.action = this.selectAction();
    //if (this.cooldown > 0) console.log(this.action);
    this.velocity.x += this.action.direction.x;
    this.velocity.y += this.action.direction.y;

    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            if (ent.name !== "Zombie" && ent.name !== "Rock") {
                var temp = { x: this.velocity.x, y: this.velocity.y };
                var dist = distance(this, ent);
                var delta = this.radius + ent.radius - dist;
                var difX = (this.x - ent.x) / dist;
                var difY = (this.y - ent.y) / dist;

                this.x += difX * delta / 2;
                this.y += difY * delta / 2;
                ent.x -= difX * delta / 2;
                ent.y -= difY * delta / 2;

                this.velocity.x = ent.velocity.x * friction;
                this.velocity.y = ent.velocity.y * friction;
                ent.velocity.x = temp.x * friction;
                ent.velocity.y = temp.y * friction;
                this.x += this.velocity.x * this.game.clockTick;
                this.y += this.velocity.y * this.game.clockTick;
                ent.x += ent.velocity.x * this.game.clockTick;
                ent.y += ent.velocity.y * this.game.clockTick;
            }
            if (ent.name === "Rock" && this.rocks < 2) {
                this.rocks++;
                ent.removeFromWorld = true;
            }
        }
    }


    if (this.cooldown === 0 && this.action.throwRock && this.rocks > 0) {
        this.cooldown = 1;
        this.rocks--;
        var target = this.action.target;
        var dir = direction(target, this);

        var rock = new Rock(this.game);
        rock.x = this.x + dir.x * (this.radius + rock.radius + 20);
        rock.y = this.y + dir.y * (this.radius + rock.radius + 20);
        rock.velocity.x = dir.x * rock.maxSpeed;
        rock.velocity.y = dir.y * rock.maxSpeed;
        rock.thrown = true;
        rock.thrower = this;
        this.game.addEntity(rock);
    }

    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
};

JRRT.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
};