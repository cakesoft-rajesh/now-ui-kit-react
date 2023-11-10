import Swal from "sweetalert2";
import React, { Component } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import {
  Row,
  Col,
  Input,
  Button,
  InputGroup,
  InputGroupText
} from "reactstrap";
import PageSpinner from "../../components/PageSpinner";
import config from "config";
import * as Server from "../../utils/Server";
import "react-spring-bottom-sheet/dist/style.css"

class ReconstructKeyPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: this.props.location.state ? this.props.location.state.email : "",
      password: "",
      showPassword: false,
      keyShare1: localStorage.getItem("keyShare1"),
      keyShare2: "",
      rpcUrl: config.rpcUrl
    };
  }

  verifyPasswordAndLogin = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/web3Auth/verifyPasswordAndLogin",
        method: "POST",
        data: {
          email: this.state.email,
          password: this.state.password
        }
      });
      if (response.success) {
        localStorage.setItem("tokenId", response.user.tokenId);
        localStorage.setItem("walletAddress", response.walletAddress);
        localStorage.setItem("accessToken", response.accessToken);
        Object.assign(response,
          {
            signupMethod: "web3",
            message: "Logged in Successfully"
          }
        );
        Server.sendDataToMobileApp(JSON.stringify(response));
      }
    } catch (error) {
      this.setState({ showLoader: false });
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "OK",
        confirmButtonColor: "#2CA8FF"
      });
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
                  <Row style={{ justifyContent: "center" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      Your recovery password is required because you have changed devices
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
                      <img
                        style={{ width: "80px" }}
                        alt="..."
                        src="set_password.png"
                      />
                    </Col>
                    <Col sm={12} className="mt-2" style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <h5 style={{ fontWeight: 700 }}>Enter recovery password</h5>
                    </Col>
                    <Col sm={12} style={{ padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <InputGroup>
                        <Input
                          style={{ border: "transparent", color: "black", background: "white", fontSize: "15px" }}
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
                      <label
                        style={{
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "15px"
                        }}
                        onClick={() =>
                          this.props.history.push({
                            pathname: "/generate-key-page",
                            state: {
                              email: this.state.email,
                              walletAddress: localStorage.getItem("walletAddress"),
                              editKeyFactor: true
                            }
                          })
                        }
                      >
                        Forgot Password?
                      </label>
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
                        onClick={this.verifyPasswordAndLogin}
                      >
                        Enter password
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row >
            </div >
        }
      </>
    );
  }
}

export default ReconstructKeyPage;