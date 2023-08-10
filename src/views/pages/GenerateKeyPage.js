import React, { Component } from "react";
import { MdVerified } from "react-icons/md";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import {
  Button,
  Row,
  Input,
  Col,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import * as Server from "../../utils/Server";
import "react-spring-bottom-sheet/dist/style.css"

class GenerateKeyPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: props.email,
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      setPassword: false,
      keyShare1: localStorage.getItem("keyShare1"),
      keyShare2: localStorage.getItem("keyShare2"),
      walletAddress: props.walletAddress,
      rpcUrl: "https://rpc-mumbai.maticvigil.com"
    };
  }

  setPassword = async () => {
    try {
      this.setState({ showLoader: true });
      if (!this.state.password) throw Error('Password is required');
      if (this.state.password !== this.state.confirmPassword) throw Error('Password mismatch');
      let response = await Server.request({
        url: "/web3Auth/setPassword",
        method: "POST",
        data: {
          email: this.state.email,
          password: this.state.password,
          confirmPassword: this.state.confirmPassword
        }
      });
      if (response.success) {
        this.setState({
          showLoader: false,
          password: "",
          confirmPassword: "",
          setPassword: true
        });
        if (this.props.editKeyFactor) {
          if (this.props.fromPage === "loginPage") {
            this.props.updateStateValue({
              editKeyFactorPage: false,
              reconstructKeyPage: true
            });
          } else {
            this.props.updateStateValue({
              editKeyFactorPage: false
            });
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

  registerPrivateKey = async () => {
    try {
      this.setState({ showLoader: true });
      if (this.state.password !== this.state.confirmPassword) throw Error('Password mismatch');
      let response = await Server.request({
        url: "/web3Auth/registerPrivateKey",
        method: "POST",
        data: {
          email: this.state.email,
          keyShare1: this.state.keyShare1,
          keyShare2: this.state.keyShare2,
          walletAddress: this.state.walletAddress
        }
      });
      if (response.success) {
        localStorage.setItem("walletAddress", this.state.walletAddress);
        this.setState({
          showLoader: false,
        });
        this.props.updateStateValue({
          generateKeyPage: false,
          privateKeyCreated: true
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

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <>
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Col
                  sm="12"
                  style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
                >
                  <Row style={{ justifyContent: "center", margin: "20px 0px" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      Setup authentication factors
                    </div>
                  </Row>
                  <Row style={{ justifyContent: "center", margin: "20px 0px" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "15px",
                        fontWeight: 500,
                      }}
                    >
                      Setting Authentication Factors allows you to use multiple devices or switch to a new device seamlessly. Set up 2 factors below
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
                      <h5 style={{ fontWeight: 700 }}>Set recovery password</h5>
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
                              placeholder="create password"
                              type={this.state.showPassword ? "text" : "password"}
                              required
                              onChange={(event) => this.setState({ password: event.target.value })}
                            />
                            <InputGroupText
                              style={{
                                border: "transparent",
                                borderTopLeftRadius: "0px",
                                borderBottomLeftRadius: "0px",
                                background: "rgb(198, 198, 198)",
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
                        <Col sm={12} className="mt-3" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <InputGroup>
                            <Input
                              style={{ border: "transparent", color: "black", background: "white" }}
                              value={this.state.confirmPassword}
                              placeholder="confirm password"
                              type={this.state.showConfirmPassword ? "text" : "password"}
                              required
                              onChange={(event) => this.setState({ confirmPassword: event.target.value })}
                            />
                            <InputGroupText
                              style={{
                                border: "transparent",
                                borderTopLeftRadius: "0px",
                                borderBottomLeftRadius: "0px",
                                background: "rgb(198, 198, 198)",
                                padding: "0px 20px"
                              }}
                            >
                              {this.state.showConfirmPassword
                                ? <IoMdEyeOff
                                  size="20"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => this.setState({ showConfirmPassword: false })}
                                />
                                : <IoMdEye
                                  size="20"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => this.setState({ showConfirmPassword: true })}
                                />
                              }
                            </InputGroupText>
                          </InputGroup>
                        </Col>
                        <Col sm={12} className="mt-1" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                          {this.props.editKeyFactor
                            ? <>
                              <Button
                                style={{
                                  width: "100%",
                                  padding: "13px 0px",
                                  fontSize: "15px",
                                  fontWeight: "bold",
                                  marginRight: "10px"
                                }}
                                className="btn-round"
                                color="info"
                                size="lg"
                                onClick={
                                  () => this.props.fromPage === "loginPage"
                                    ? this.props.updateStateValue({
                                      editKeyFactorPage: false,
                                      reconstructKeyPage: true
                                    })
                                    : this.props.updateStateValue({
                                      editKeyFactorPage: false
                                    })
                                }
                                outline
                              >
                                Cancel
                              </Button>
                              <Button
                                style={{
                                  width: "100%",
                                  padding: "13px 0px",
                                  fontSize: "15px",
                                  fontWeight: "bold",
                                  marginLeft: "10px"
                                }}
                                className="btn-round"
                                color="info"
                                size="lg"
                                onClick={this.setPassword}
                              >
                                Save
                              </Button>
                            </>
                            : <Button
                              style={{
                                width: "100%",
                                padding: "13px 0px",
                                fontSize: "15px",
                                fontWeight: "bold",
                              }}
                              className="btn-round"
                              color="info"
                              size="lg"
                              onClick={this.setPassword}
                            >
                              Set password
                            </Button>
                          }
                        </Col>
                      </>
                    }
                  </Row>
                  {this.state.setPassword
                    &&
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
                        onClick={this.registerPrivateKey}
                      >
                        Submit
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
        }
      </>
    );
  }
}

export default GenerateKeyPage;