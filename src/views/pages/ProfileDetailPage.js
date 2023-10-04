import moment from "moment";
import Copy from "copy-to-clipboard";
import { MdEdit } from "react-icons/md";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import { FaLink, FaCopy } from "react-icons/fa";
import {
  Button,
  Row,
  Col,
  Tooltip
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "components/PageSpinner";
import config from "../../config";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

const wc = new WalletConnect();

class ProfileDetailPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      user: {},
      email: this.props.location.state ? this.props.location.state.email : "",
      password: this.props.location.state ? this.props.location.state.password : "",
      firstName: this.props.location.state ? this.props.location.state.firstName : "",
      lastName: this.props.location.state ? this.props.location.state.lastName : "",
      phone: this.props.location.state ? this.props.location.state.phone : "",
      displayUsername: this.props.location.state ? this.props.location.state.displayUsername : "",
      walletAddress: this.props.location.state ? this.props.location.state.walletAddress : "",
      skip2FactorAuth: this.props.location.state ? this.props.location.state.skip2FactorAuth : false,
      membershipStatus: "",
      dokuId: "",
      expiryTime: "",
      showCopyToClipboardToolTip: false,
    };
  }

  async componentDidMount() {
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    const dokuId = localStorage.getItem("dokuId");
    if (dokuId) this.setState({ dokuId });
    if (params.walletAddress && params.tokenId) {
      await this.getUser(params.walletAddress, params.tokenId);
    }
  }

  getUser = async (walletAddress, tokenId) => {
    try {
      this.setState({ showLoader: true });
      const chainId = localStorage.getItem("chainId");
      let response = await Server.request(
        {
          url: `/user/detail?chainId=${chainId}&walletAddress=${walletAddress}&tokenId=${tokenId}&membershipWithExpiry=${GeneralFunctions.getMembershipWithExpiry()}`,
          method: "GET",
        }
      );
      if (response.success) {
        if (response.userFound) {
          this.setState({
            showLoader: false,
            ...response.user,
            user: response.user
          });
          // async () => (!this.state.skip2FactorAuth && await this.sendOTP()));
        } else {
          this.props.history.push({
            pathname: "/profile-page",
            state: {
              walletAddress
            }
          });
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

  sendOTP = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request(
        {
          url: "/email/sendOTP",
          method: "POST",
          data: {
            email: this.state.email
          }
        }
      );
      if (response.success) {
        this.props.history.push({
          pathname: "/otp-page",
          state: {
            fromPage: "profileDetailPage",
            email: this.state.email,
            user: this.state.user
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

  logout = async () => {
    await Server.sendDataToMobileApp(JSON.stringify({ message: 'Logout successfully' }));
    if (localStorage.getItem("signIn")) {
      let details = navigator.userAgent;
      let regexp = /android|iphone|kindle|ipad/i;
      let isMobileDevice = regexp.test(details);
      if (isMobileDevice) {
        const connector = await wc.connect();
        await connector.killSession();
      }
    }
    const membershipWithExpiry = GeneralFunctions.getMembershipWithExpiry();
    await GeneralFunctions.clearFullLocalStorage();
    this.props.history.push(`/login-page?membershipWithExpiry=${membershipWithExpiry}`)
  }

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <Row style={{ height: "100vh" }}>
              <Col
                sm={12}
                style={
                  {
                    marginTop: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    maxHeight: "60px"
                  }
                }
              >
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    justifyContent: "space-between",
                  }}
                >
                  <Row
                    style={{
                      marginLeft: 0,
                      marginRight: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%"
                    }}
                  >
                    <img
                      style={{
                        height: "60px",
                        width: "60px",
                        borderRadius: "50%",
                        verticalAlign: "middle"
                      }}
                      src={`${config.REACT_APP_CHAT_BASE_URL}/avatar/${this.state.phone}?forPOC=true`}
                      alt=""
                    />
                  </Row>
                  <Row
                    style={{
                      marginLeft: 0,
                      marginRight: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%"
                    }}
                  >
                    <label
                      style={{
                        color: "gray",
                        fontSize: "10px",
                        fontWeight: 500
                      }}
                    >
                      Hidden for anonymous transactions
                    </label>
                  </Row>
                </Row>
              </Col>
              <Col
                sm={12}
                style={{
                  marginTop: 10,
                  backgroundColor: "#e0e0e0",
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  height: window.innerHeight < 565 ? "unset" : "calc(100vh - 90px)"
                }}
              >
                <Row style={{ marginTop: 10, justifyContent: "center", alignItems: "center" }}>
                  <Col
                    xs={8}
                    style={{ marginTop: 15 }}
                    className="d-flex align-items-center"
                  >
                    <h6>
                      {this.state.firstName ? `${this.state.firstName} ${this.state.lastName}` : null}
                    </h6>
                  </Col>
                  <Col
                    xs={4}
                    style={{ marginTop: 15, color: "gray" }}
                    className="d-flex align-items-center justify-content-end"
                  >
                    <h6
                      style={{
                        cursor: "pointer",
                      }}
                      onClick={() => Server.sendDataToMobileApp(JSON.stringify(
                        {
                          message: 'profile edit',
                          email: this.state.email,
                          firstName: this.state.firstName,
                          lastName: this.state.lastName,
                          phone: this.state.phone,
                          displayUsername: this.state.displayUsername,
                          username: this.state.user.username
                        }
                      ))}
                    >
                      Edit
                      <MdEdit
                        style={{
                          marginLeft: "5px"
                        }}
                      />
                    </h6>
                  </Col>
                </Row>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col sm={5} className="d-flex align-items-center">
                    <div style={{
                      marginRight: 0,
                      marginBottom: 10,
                      border: "1px solid #275996",
                      borderRadius: "15px",
                      padding: "6px",
                      background: "#275996",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                      <FaLink color="white" />
                    </div>
                    <h6 style={{ marginLeft: 5, color: "gray" }}>
                      {this.state.walletAddress ?
                        GeneralFunctions._getFormatAddress(this.state.walletAddress)
                        : "0x0000...0000"}
                    </h6>
                    <FaCopy
                      id="copyToClipboard"
                      size="16"
                      style={{ cursor: "pointer", marginBottom: "7px", marginLeft: "7px", marginRight: "10px" }}
                      onClick={() => {
                        Copy(this.state.walletAddress);
                        this.setState({ showCopyToClipboardToolTip: true });
                        setTimeout(() => this.setState({ showCopyToClipboardToolTip: false }), 3000);
                      }}
                    />
                    <Tooltip
                      style={{
                        fontSize: "15px",
                        fontWeight: "bold",
                        background: "rgb(80 84 86)",
                        borderRadius: "5px",
                        padding: "5px",
                        color: "white",
                      }}
                      placement="right"
                      isOpen={this.state.showCopyToClipboardToolTip}
                      target="copyToClipboard"
                    >
                      Copied
                    </Tooltip>
                  </Col>
                </Row>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col
                    sm={5}
                    className="d-flex align-items-center"
                    style={{ color: "gray" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                      Payment Id :
                    </div>
                    <h6 style={{ marginLeft: 5 }}>
                      {this.state.dokuId || "Pending"}
                    </h6>
                  </Col>
                </Row>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col
                    sm={5}
                    className="d-flex align-items-center"
                    style={{ color: "gray" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                      Membership :
                    </div>
                    <h6 style={{ marginLeft: 5 }}>
                      {this.state.membershipStatus || "Pending"}
                    </h6>
                  </Col>
                </Row>
                {GeneralFunctions.getMembershipWithExpiry() &&
                  <Row
                    style={{
                      marginLeft: 0,
                      marginRight: 0,
                      display: "flex",
                      // justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className="d-flex align-items-center"
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                        Membership Expiry:
                      </div>
                      <h6 style={{ marginLeft: 5 }}>
                        {this.state.expiryTime
                          ? moment(Number(this.state.expiryTime) * 1000).local().format("MM/DD/YYYY hh:mm A")
                          : ""
                        }
                      </h6>
                    </Col>
                  </Row>
                }
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col
                    sm={5}
                    className="d-flex align-items-center"
                    style={{ color: "gray" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                      Name :
                    </div>
                    <h6 style={{ marginLeft: 5, textTransform: "none" }}>
                      {`${this.state.firstName} ${this.state.lastName}`}
                    </h6>
                  </Col>
                </Row>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col
                    sm={5}
                    className="d-flex align-items-center"
                    style={{ color: "gray" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                      Phone :
                    </div>
                    <h6 style={{ marginLeft: 5, textTransform: "none" }}>{this.state.phone}</h6>
                  </Col>
                </Row>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col
                    sm={5}
                    className="d-flex align-items-center"
                    style={{ color: "gray" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                      Username :
                    </div>
                    <h6 style={{ marginLeft: 5, textTransform: "none" }}>{this.state.displayUsername}</h6>
                  </Col>
                </Row>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Col
                    sm={5}
                    className="d-flex align-items-center"
                    style={{ color: "gray" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: 0, marginBottom: 10 }}>
                      Email :
                    </div>
                    <h6 style={{ marginLeft: 5, textTransform: "none" }}>{this.state.email}</h6>
                  </Col>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Col xs={12} sm={6}>
                    <Button
                      onClick={() => {
                        Server.sendDataToMobileApp(JSON.stringify({ message: 'My credentials' }));
                      }}
                      style={{
                        width: "100%",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round" color="info" type="button" outline>
                      Go to my Credentials
                    </Button>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Button
                      onClick={() => this.props.history.push({
                        pathname: "/generate-key-page",
                        state: {
                          email: this.state.email,
                          walletAddress: this.state.walletAddress,
                          editKeyFactor: true,
                        }
                      })}
                      style={{
                        width: "100%",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round" color="info" type="button" outline>
                      Edit authentication factors
                    </Button>
                  </Col>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Col sm={12}>
                    <Button
                      onClick={() => {
                        Server.sendDataToMobileApp(JSON.stringify({ message: 'homePage' }));
                      }}
                      style={{
                        width: "100%",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round" color="info" type="button" size="lg">
                      Done
                    </Button>
                  </Col>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Col sm={12}>
                    <Button
                      onClick={this.logout}
                      style={{
                        width: "100%",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round" color="info" type="button" size="lg"
                      outline
                    >
                      Logout
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row >
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

export default ProfileDetailPage;