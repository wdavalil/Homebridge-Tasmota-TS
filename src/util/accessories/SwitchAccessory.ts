import { wait } from "../wait";

let Characteristic: any;

export class SwitchAccessory {

  static switchType: string = "switch";
  static infoModel: string  = "Switch";

  public switchService: any;

  log: Function;
  request: any;
  ip: string;
  user: string;
  password: string;
  updateInterval: number;
  debugMsgLog: number;
  updateTimer: any;

  constructor(log: Function,
              request: any,
              ip: string,
              user: string,
              password: string,
              updateInterval: number,
              debugMsgLog: number,
              characteristic: any
              ) {

    this.log            = log;
    this.request        = request;
    this.ip             = ip;
    this.user           = user;
    this.password       = password;
    this.updateInterval = updateInterval;
    this.debugMsgLog    = debugMsgLog;
    Characteristic      = characteristic;

    if (this.updateInterval > 0) {
      this.switchAutoUpdate();
    }

  }

  //
  // Tasmota Switch Service
  //

  getSwitchOn = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    let userPasswordString = ((this.user != "none") && (this.password != "none")) ? "user=" + this.user + "&password=" + this.password + "&" : "";

    let requestString = "http://" + this.ip + "/cm?" + userPasswordString + "cmnd=Power Status";

    this.request(requestString, async (error: any, res: { statusCode: number; }, body: string) => {
        if (error) {
          this.log(`error: : ${error}`);
          return;
        }

        if (res.statusCode == 200) {
          let obj = JSON.parse(body.toLowerCase());
          
          const on = obj.power == "on" ? true : false;
          this.debugLogBool("Switch ?", on);

          await wait(1);

          this.switchService.updateCharacteristic(
            Characteristic.On,
            on
          );

          if (obj.warning) {
            this.log("Warning: " + obj.warning);
          }

        }

        if (this.updateInterval > 0) {
          this.switchAutoUpdate();
        }

      }
    );

  };

  setSwitchOn = async (on: boolean) => {
    this.debugLogBool("Set switch to", on);

    let onString = on == true ? "On" : "Off";

    let userPasswordString = ((this.user != "none") && (this.password != "none")) ? "user=" + this.user + "&password=" + this.password + "&" : "";

    let requestString = "http://" + this.ip + "/cm?" + userPasswordString + "cmnd=Power " + onString;

    this.request(requestString, async (error: any, res: { statusCode: number; }, body: string) => {
        if (error) {
          this.log(`error: : ${error}`);
          return;
        }

        if (res.statusCode == 200) {
          let obj = JSON.parse(body.toLowerCase());
          
          const on = obj.power == "on" ? true : false;
          this.debugLogBool("Switch ?", on);

          await wait(1);

          this.switchService.updateCharacteristic(
            Characteristic.On,
            on
          );

          if (obj.warning) {
            this.log("Warning: " + obj.warning);
          }

        }

        if (this.updateInterval > 0) {
          this.switchAutoUpdate();
        }

      }
    );

  };

  //
  // Helper Functions
  //

  debugLogNum(msg: string, num: number) {
    if (this.debugMsgLog == 1) {
      this.log(msg, num);
    }
  }
  debugLogBool(msg: string, bool: boolean) {
    if (this.debugMsgLog == 1) {
      this.log(msg, bool);
    }
  }

  switchAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getSwitchOn();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}