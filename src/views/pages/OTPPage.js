import Web3 from "web3";
import OtpInput from "react-otp-input";
import React, { Component } from "react";
import {
  Row,
  Col,
  Button,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"

class OTPPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      otp: "",
      email: this.props.location.state ? this.props.location.state.email : "",
      fromPage: this.props.location.state ? this.props.location.state.fromPage : "",
      userData: this.props.location.state ? this.props.location.state.user : "",
      walletCreated: this.props.location.state ? this.props.location.state.walletCreated : false,
      goBack: this.props.history.goBack,
      walletAddressExistsOnPhone: localStorage.getItem("walletAddressExistsOnPhone") ? true : false,
      walletAddress: localStorage.getItem("walletAddress")
    };
  }

  createWallet = () => {
    let web3 = new Web3(this.state.rpcUrl);
    let account = web3.eth.accounts.create();
    return {
      walletAddress: account.address,
      privateKey: account.privateKey,
    };
  }

  verifyOTPFor2FA = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request(
        {
          url: "/email/verifyOTP",
          method: "POST",
          data: {
            email: this.state.email,
            otp: this.state.otp
          }
        }
      );
      if (response.success) {
        this.props.history.push({
          pathname: "/profile-detail-page",
          state: {
            ...this.state.userData,
            skip2FactorAuth: true
          }
        });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  verifyOTP = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/verifyOTP",
        method: "POST",
        data: {
          email: this.state.email,
          otp: this.state.otp,
          walletAddress: this.state.walletAddress,
          walletAddressExistsOnPhone: this.state.walletAddressExistsOnPhone
        }
      });
      if (response.success) {
        if (this.state.walletAddressExistsOnPhone) {
          localStorage.setItem("tokenId", response.userData.user.tokenId);
          localStorage.setItem("walletAddress", response.userData.walletAddress);
          localStorage.setItem("accessToken", response.userData.accessToken);
          Object.assign(response.userData,
            {
              signupMethod: "web3",
              message: "Logged in Successfully"
            }
          );
          Server.sendDataToMobileApp(JSON.stringify(response.userData));
        } else {
          if (response.userRegistered) {
            localStorage.setItem("keyShare1", response.keyShare1);
            localStorage.setItem("privateKeyCreated", response.privateKeyCreated);
            this.props.history.push({
              pathname: "/reconstruct-key-page",
              state: {
                email: this.state.email
              }
            });
          } else {
            if (response.privateKeyCreated) {
              localStorage.setItem("keyShare1", response.keyShare1);
              localStorage.setItem("keyShare2", response.keyShare2);
              localStorage.setItem("walletAddress", response.walletAddress);
              localStorage.setItem("privateKeyCreated", response.privateKeyCreated);
              this.props.history.push({
                pathname: "/profile-page",
                state: {
                  signUpByEmail: true,
                  email: this.state.email,
                  walletAddress: response.walletAddress
                }
              });
            } else {
              const { privateKey, walletAddress } = this.createWallet();
              const encryptPrivateKey = await GeneralFunctions.encrypt(privateKey);
              const keyShare1 = encryptPrivateKey.slice(0, encryptPrivateKey.length / 2)
              const keyShare2 = encryptPrivateKey.slice(encryptPrivateKey.length / 2, encryptPrivateKey.length)
              this.setState({ showLoader: false });
              localStorage.setItem("keyShare1", keyShare1);
              localStorage.setItem("keyShare2", keyShare2);
              localStorage.setItem("walletAddress", walletAddress);
              this.props.history.push({
                pathname: "/profile-page",
                state: {
                  signUpByEmail: true,
                  email: this.state.email,
                  walletAddress,
                }
              });
            }
          }
        }
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <div
              style={{
                flexDirection: "column",
                display: "flex",
                marginTop: 20,
              }}
            >
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Col
                  sm="12"
                  style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
                >
                  <Row style={{ justifyContent: "flex-start" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "20px",
                        fontWeight: "500",
                      }}
                    >
                      {`A verification code will be sent to your email ${this.state.email && GeneralFunctions.maskEmailId(this.state.email)}`}
                    </div>
                  </Row>
                  <Row style={{ justifyContent: "flex-start", marginTop: 5 }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "20px",
                        fontWeight: "500",
                      }}
                    >
                      Enter the code here:
                    </div>
                  </Row>
                  <Row style={{ justifyContent: "flex-start", margin: "25px 0px" }}>
                    <OtpInput
                      className="d-flex justify-content-center otpCss"
                      inputStyle={{
                        color: "black",
                        width: "10vw",
                        height: "15vw",
                        margin: "0 5px",
                        fontSize: "6vw",
                        borderRadius: "5px",
                        border:
                          "1px solid rgba(0,0,0,0.3)",
                        outlineColor: "#17517b",
                      }}
                      isInputNum={true}
                      value={this.state.otp}
                      onChange={(value) =>
                        this.setState({
                          otp: value,
                        })
                      }
                      numInputs={6}
                      separator={<span style={{ color: "black" }}>-</span>}
                    />
                  </Row>
                  <Row style={{ justifyContent: "flex-start", margin: "0px 30px" }}>
                    <Button
                      style={{
                        width: "100%",
                        padding: "13px 0px",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round"
                      color="info"
                      type="submit"
                      size="lg"
                      onClick={this.verifyOTP}
                    >
                      Verify OTP
                    </Button>
                  </Row>
                  <Row style={{ justifyContent: "flex-start", marginTop: 50 }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "20px",
                        fontWeight: "500",
                      }}
                    >
                      {
                        (this.state.fromPage !== "profileDetailPage" && !this.state.walletAddressExistsOnPhone && !this.state.walletCreated)
                        && "A blockchain connected wallet address will be created for you to protect your identity, enable passwordless sign in, and allow access to new benefits and rewards"
                      }
                    </div>
                  </Row>
                </Col>
              </Row>
            </div>
        }
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
      </>
    );
  }
}

export default OTPPage;