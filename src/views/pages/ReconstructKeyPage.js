import Web3 from "web3";
import React, { Component } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { MdVerified } from "react-icons/md";
import {
  Row,
  Col,
  Input,
  Button,
  InputGroup,
  InputGroupText
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"

class ReconstructKeyPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: props.email,
      password: "",
      showPassword: false,
      setPassword: false,
      keyShare1: localStorage.getItem("keyShare1"),
      keyShare2: "",
      rpcUrl: "https://rpc-mumbai.maticvigil.com",
    };
  }

  verifyPassword = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/web3Auth/verifyPassword",
        method: "POST",
        data: {
          email: this.state.email,
          password: this.state.password
        }
      });
      if (response.success) {
        this.setState({
          showLoader: false,
          password: "",
          setPassword: true,
          keyShare2: response.keyShare2
        });
        localStorage.setItem("keyShare2", response.keyShare2);
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  reconstructPrivateKey = async () => {
    try {
      this.setState({ showLoader: true });
      const privateKey = await GeneralFunctions.decrypt(`${this.state.keyShare1}${this.state.keyShare2}`);
      let web3 = new Web3(this.state.rpcUrl);
      let account = web3.eth.accounts.privateKeyToAccount(privateKey);
      localStorage.setItem("walletAddress", account.address);
      let response = await Server.request({
        url: "/web3Auth/loginWithEmail",
        method: "POST",
        data: {
          walletAddress: account.address
        }
      });
      if (response.success) {
        localStorage.setItem("signupOrLoginMethod", "web3");
        localStorage.setItem("tokenId", response.user.tokenId);
        localStorage.setItem("walletAddress", response.walletAddress);
        Object.assign(response, { signupMethod: "web3" });
        Server.sendDataToMobileApp(JSON.stringify(response));
        this.setState({ showLoader: false });
      } else {
        throw Error(response.message);
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  }

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <Row style={{ justifyContent: "center", alignItems: "center" }}>
          <Col
            sm="12"
            style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
          >
            <Row style={{ justifyContent: "center", marginBottom: 10 }}>
              <div
                style={{
                  color: "gray",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                Authentication factors
              </div>
            </Row>
            <Row style={{ justifyContent: "center" }}>
              <div
                style={{
                  color: "gray",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                Pair key with an authentication factor.
              </div>
            </Row>
            <Row
              style={{
                justifyContent: "center",
                margin: "20px 0px",
                border: "1px solid gray",
                borderRadius: "15px",
                padding: "20px 15px",
                background: "rgb(224, 224, 224)",
                minHeight: "200px"
              }}
            >
              <Col sm={12} style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <MdVerified
                  size="45"
                  color="#2ca8ff"
                />
              </Col>
              <Col sm={12} className="mt-2" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h5 style={{ fontWeight: 700 }}>Pair with your email</h5>
              </Col>
              <Col sm={12} style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Input
                  style={{ border: "transparent", color: "black", background: "white" }}
                  value={this.state.email}
                  disabled
                ></Input>
              </Col>
              <Col sm={12} className="mt-3" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Input
                  style={{ border: "transparent", color: "black", background: "white" }}
                  value={this.state.keyShare1}
                  disabled
                ></Input>
              </Col>
            </Row>
            <Row
              style={{
                justifyContent: "center",
                margin: "20px 0px",
                border: "1px solid gray",
                borderRadius: "15px",
                padding: "20px 15px",
                background: "rgb(224, 224, 224)",
                minHeight: "200px"
              }}
            >
              <Col sm={12} style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                {this.state.setPassword
                  ? <MdVerified
                    size="45"
                    color="#2ca8ff"
                  />
                  : <img
                    style={{ width: "80px" }}
                    alt="..."
                    src="set_password.png"
                  />
                }
              </Col>
              <Col sm={12} className="mt-2" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h5 style={{ fontWeight: 700 }}>Enter recovery password</h5>
              </Col>
              {this.state.setPassword
                ? <Col sm={12} style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Input
                    style={{ border: "transparent", color: "black", background: "white" }}
                    value={this.state.keyShare2}
                    disabled
                  ></Input>
                </Col>
                : <>
                  <Col sm={12} style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <InputGroup>
                      <Input
                        style={{ border: "transparent", color: "black", background: "white" }}
                        value={this.state.password}
                        placeholder="Enter password"
                        type={this.state.showPassword ? "text" : "password"}
                        required
                        onChange={(event) => this.setState({ password: event.target.value })}
                      />
                      <InputGroupText
                        style={{
                          border: "transparent",
                          borderTopLeftRadius: "0px",
                          borderBottomLeftRadius: "0px",
                          backgroundColor: "rgb(198, 198, 198)",
                          padding: "0px 20px"
                        }}
                      >
                        {this.state.showPassword
                          ? <IoMdEyeOff
                            size="20"
                            style={{ cursor: "pointer" }}
                            onClick={() => this.setState({ showPassword: false })}
                          />
                          : <IoMdEye
                            size="20"
                            style={{ cursor: "pointer" }}
                            onClick={() => this.setState({ showPassword: true })}
                          />
                        }
                      </InputGroupText>
                    </InputGroup>
                  </Col>
                  <Col sm={12} className="mt-1" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Button
                      style={{
                        width: "100%",
                        padding: "13px 0px",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round"
                      color="info"
                      size="lg"
                      onClick={this.verifyPassword}
                    >
                      Enter password
                    </Button>
                  </Col>
                </>
              }
            </Row>
            {
              this.state.setPassword &&
              <Row
                style={{
                  justifyContent: "center",
                  margin: "20px"
                }}
              >
                <Button
                  style={{
                    width: "100%",
                    padding: "13px 0px",
                    fontSize: "15px",
                    fontWeight: "bold",
                    margin: 0
                  }}
                  className="btn-round"
                  color="info"
                  size="lg"
                  onClick={this.reconstructPrivateKey}
                >
                  Reconstruct your key
                </Button>
              </Row>
            }
          </Col>
        </Row >
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

export default ReconstructKeyPage;