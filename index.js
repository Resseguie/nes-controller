var HID = require('node-hid');

var definitions = {
    "2Axes 11Keys Game  Pad" : {
        "buttons": {
            "A":        [3, 0x01],
            "B":        [3, 0x02],
            "SELECT":   [4, 0x01],
            "START":    [4, 0x02],
        }
    },
    "USB Gamepad " : {
        "buttons": {
            "A":        [5, 0x20],
            "B":        [5, 0x40],
            "SELECT":   [6, 0x10],
            "START":    [6, 0x20],
        }
    }
}

function NESController(path, controller) {
    HID.HID.call(this, path);
    this.controlState = new Buffer(8);


    this.buttons = controller.buttons;

    this.on("data", function(data) {

        var analogEW = data[0];
        var analogNS = data[1];
        if (this.controlState[0] != analogEW) {
            this.emit("analogEW", analogEW);
            this.emit("analog", [analogEW, analogNS]);
        }
        if (this.controlState[1] != analogNS) {
            this.emit("analogNS", analogNS);
            this.emit("analog", [analogEW, analogNS]);
        }

        for (key in this.buttons) {
            var address = this.buttons[key];
            var chunk = address[0];
            var mask = address[1];
            if (
                // check if different from controlState
                (this.controlState[chunk] & mask) !=
                (data[chunk] & mask)
            ) {

                if ((data[chunk] & mask) === mask) {
                    this.emit("press"+key);
                } else {
                    this.emit("release"+key);
                }
            }
        };

        // save state to compare against next frame
        data.copy(this.controlState);
    });
}

NESController.prototype = Object.create(HID.HID.prototype);
NESController.prototype.constructor = NESController;

module.exports = function() {
    var controllers = [];

    HID.devices().forEach(function(device) {
        if (!~Object.keys(definitions).indexOf(device.product)) return;
        var definition = definitions[device.product];
        var controller = new NESController(device.path, definition);
        controllers.push(controller);
    });
    return controllers;
}
