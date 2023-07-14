import { Link } from "react-router-dom";
import React, { Component } from "react";
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
  Form,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import OTPPage from "./OTPPage";
import ConnectWalletPage from "./ConnectWalletPage";
import PageSpinner from "../../components/PageSpinner";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"

class SignUpPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: "",
      ztiAppName: "",
      showOTPage: false,
      showConnectWalletPage: false,
    };
  }

  async componentDidMount() {
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    if (params.ztiAppName) this.setState({ ztiAppName: params.ztiAppName });
  }

  sendOTP = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/sendOTP",
        method: "POST",
        data: {
          email: this.state.email
        }
      });
      if (response.success) {
        this.setState({ showLoader: false, showOTPage: true });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  toggleConnectWalletPage = () => {
    this.setState({ showConnectWalletPage: !this.state.showConnectWalletPage });
  };

  updateStateValue = (value) => this.setState(value);

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <div
          style={{
            flexDirection: "column",
            display: "flex",
            marginTop: 20,
            overflow: "hidden",
            overflowY: "auto"
          }}
        >
          {this.state.showOTPage &&
            <OTPPage
              {...this.props}
              fromPage="signupPage"
              email={this.state.email}
              updateStateValue={this.updateStateValue}
            />
          }
          {this.state.showConnectWalletPage &&
            <ConnectWalletPage
              {...this.props}
              fromPage="signupPage"
            />
          }
          {
            !this.state.showOTPage &&
            !this.state.showConnectWalletPage &&
            <Row style={{ justifyContent: "center", alignItems: "center" }}>
              <Col
                sm="12"
                style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
              >
                <Row
                  style={{
                    justifyContent: "end",
                    alignItems: "center",
                  }}
                >
                  <Button
                    style={{
                      padding: "13px 30px",
                      fontSize: "15px",
                      fontWeight: "bold",
                      marginBottom: "30px",
                    }}
                    className="btn-round"
                    color="info"
                    type="button"
                    size="lg"
                    outline
                    to="/login-page"
                    tag={Link}
                  >
                    Login
                  </Button>
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img
                    alt=''
                    src='/logos/zti.png'
                    width="30%"
                    style={{ marginTop: 40 }}
                  />
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ color: "gray", marginTop: 15, fontWeight: 600 }}>{this.state.ztiAppName.toUpperCase()}</h3>
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ color: "gray", margin: 0 }}>Sign up with email</h3>
                </Row>
                {/* Code for signup with email */}
                <Form onSubmit={(event) => this.sendOTP(event)}>
                  <Row
                    style={{
                      justifyContent: "center",
                      marginLeft: 10,
                      marginRight: 10,
                      marginTop: 20,
                    }}
                  >
                    <FormGroup style={{ width: "100%" }}>
                      <Input
                        style={{ width: "100%", borderColor: "gray" }}
                        value={this.state.email}
                        placeholder="Enter email"
                        type="email"
                        required
                        onChange={(event) => this.setState({ email: event.target.value })}
                      ></Input>
                    </FormGroup>
                  </Row>
                  <Row style={{ justifyContent: "center", alignItems: "center", margin: "0px 10px" }}>
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
                    >
                      Sign up
                    </Button>
                  </Row>
                </Form>
                <Row
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <label
                    style={{
                      color: "gray",
                      margin: 0,
                      marginTop: 10,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    onClick={this.toggleConnectWalletPage}
                  >
                    OR login with a Connected Wallet
                  </label>
                </Row>
              </Col>
            </Row>
          }
        </div>
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

export default SignUpPage;