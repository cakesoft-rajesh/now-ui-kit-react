import moment from 'moment';
import Copy from 'copy-to-clipboard';
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import { MdExitToApp } from 'react-icons/md';
import { FaLink, FaCopy } from 'react-icons/fa';
import {
  Button,
  Row,
  Col,
  Tooltip
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import GenerateKeyPage from './GenerateKeyPage';
import PageSpinner from "components/PageSpinner";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

const wc = new WalletConnect();

class ProfileDetailPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      email: this.props.location.state ? this.props.location.state.email : "",
      password: this.props.location.state ? this.props.location.state.password : "",
      firstName: this.props.location.state ? this.props.location.state.firstName : "",
      lastName: this.props.location.state ? this.props.location.state.lastName : "",
      phone: this.props.location.state ? this.props.location.state.phone : "",
      displayUsername: this.props.location.state ? this.props.location.state.displayUsername : "",
      signupMethod: this.props.location.state ? this.props.location.state.signupMethod : "",
      walletAddress: this.props.location.state ? this.props.location.state.walletAddress : "",
      membershipStatus: '',
      dokuId: '',
      expiryTime: '',
      showCopyToClipboardToolTip: false,
      editKeyFactorPage: false
    };
  }

  async componentDidMount() {
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    const dokuId = localStorage.getItem('dokuId');
    if (dokuId) this.setState({ dokuId });
    if (params.walletAddress && params.tokenId) {
      this.getUser(params.walletAddress, params.tokenId, 'web3');
    }
  }

  getUser = async (walletAddress, tokenId, signupMethod) => {
    try {
      this.setState({ showLoader: true });
      const chainId = localStorage.getItem('chainId');
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
            signupMethod
          });
        } else {
          this.props.history.push({
            pathname: '/profile-page',
            state: {
              signupMethod: 'web3',
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

  logout = async () => {
    await Server.sendDataToMobileApp(JSON.stringify({ message: 'Logout successfully' }));
    if (this.state.signupMethod === 'web3' && localStorage.getItem("signIn")) {
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

  toggleEditKeyFactorPage = () => {
    this.setState({ editKeyFactorPage: !this.state.editKeyFactorPage });
  };

  updateStateValue = (value) => this.setState(value);

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        {this.state.editKeyFactorPage &&
          <GenerateKeyPage
            {...this.props}
            email={this.state.email}
            walletAddress={this.state.walletAddress}
            updateStateValue={this.updateStateValue}
            editKeyFactor={true}
          />
        }
        {!this.state.editKeyFactorPage &&
          <Row style={{ height: "100vh" }}>
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
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 40,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#2CA8FF",
                    }}
                  >
                    <div
                      className="alert-icon"
                      style={{ marginLeft: 0, marginRight: 0, display: 'flex' }}
                    >
                      <i
                        className="now-ui-icons users_single-02"
                        style={{ color: "white", fontSize: "35px" }}
                      ></i>
                    </div>
                  </div>
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
                height: "calc(100vh - 110px)"
              }}
            >
              {this.state.signupMethod === 'web3'
                ? <>
                  <Row style={{ marginTop: 10, justifyContent: "center", alignItems: "center" }}>
                    <Col
                      sm={5}
                      className='d-flex align-items-center ml-2'
                    >
                      <h6 style={{ marginTop: 15 }}>
                        {this.state.firstName ? `${this.state.firstName} ${this.state.lastName}` : null}
                      </h6>
                    </Col>
                  </Row>
                  <Row
                    style={{
                      marginLeft: 0,
                      marginRight: 0,
                      display: "flex",
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col sm={5} className='d-flex align-items-center'>
                      <div style={{
                        marginRight: 0,
                        marginBottom: 10,
                        border: '1px solid #275996',
                        borderRadius: ' 15px',
                        padding: '6px',
                        background: '#275996',
                        display: 'flex',
                        justifyContent: ' center',
                        alignItems: ' center',
                      }}>
                        <FaLink color="white" />
                      </div>
                      <h6 style={{ marginLeft: 5, color: "gray" }}>
                        {this.state.walletAddress ?
                          GeneralFunctions._getFormatAddress(this.state.walletAddress)
                          : '0x0000...0000'}
                      </h6>
                      <FaCopy
                        id="copyToClipboard"
                        size="16"
                        style={{ cursor: 'pointer', marginBottom: '7px', marginLeft: '7px', marginRight: '10px' }}
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
                      <MdExitToApp
                        size="20"
                        style={{ cursor: 'pointer', marginBottom: '7px', marginLeft: '7px' }}
                        onClick={this.logout}
                      />
                    </Col>
                  </Row>
                  <Row
                    style={{
                      marginLeft: 0,
                      marginRight: 0,
                      display: "flex",
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className='d-flex align-items-center'
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                        Payment Id :
                      </div>
                      <h6 style={{ marginLeft: 5 }}>
                        {this.state.dokuId || 'Pending'}
                      </h6>
                    </Col>
                  </Row>
                  <Row
                    style={{
                      marginLeft: 0,
                      marginRight: 0,
                      display: "flex",
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className='d-flex align-items-center'
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                        Membership :
                      </div>
                      <h6 style={{ marginLeft: 5 }}>
                        {this.state.membershipStatus || 'Pending'}
                      </h6>
                    </Col>
                  </Row>
                  {GeneralFunctions.getMembershipWithExpiry() &&
                    <Row
                      style={{
                        marginLeft: 0,
                        marginRight: 0,
                        display: "flex",
                        justifyContent: 'center',
                        alignItems: "center",
                      }}
                    >
                      <Col
                        sm={5}
                        className='d-flex align-items-center'
                        style={{ color: "gray" }}
                      >
                        <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                          Membership Expiry:
                        </div>
                        <h6 style={{ marginLeft: 5 }}>
                          {this.state.expiryTime
                            ? moment(Number(this.state.expiryTime) * 1000).local().format("MM/DD/YYYY hh:mm A")
                            : ''
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
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className='d-flex align-items-center'
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
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
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className='d-flex align-items-center'
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
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
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className='d-flex align-items-center'
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
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
                      justifyContent: 'center',
                      alignItems: "center",
                    }}
                  >
                    <Col
                      sm={5}
                      className='d-flex align-items-center'
                      style={{ color: "gray" }}
                    >
                      <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                        Email :
                      </div>
                      <h6 style={{ marginLeft: 5, textTransform: "none" }}>{this.state.email}</h6>
                    </Col>
                  </Row>
                </>
                : <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <h4 style={{ marginTop: 20, fontWeight: 'bold' }}>Welcome {`${this.state.firstName} ${this.state.lastName}`}</h4>
                  <MdExitToApp
                    size="20"
                    style={{ cursor: 'pointer', marginLeft: '7px' }}
                    onClick={this.logout}
                  />
                </Row>
              }
              {this.state.signupMethod === 'web3'
                ? <>
                  <Row style={{ justifyContent: "center", alignItems: "center" }}>
                    <Col xs={12} sm={6}>
                      <Button
                        onClick={() => {
                          Server.sendDataToMobileApp(JSON.stringify({ message: 'My credentials' }));
                        }}
                        style={{
                          width: "100%",
                          fontSize: '15px',
                          fontWeight: 'bold',
                        }}
                        className="btn-round" color="info" type="button" outline>
                        Go to my Credentials
                      </Button>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Button
                        onClick={this.toggleEditKeyFactorPage}
                        style={{
                          width: "100%",
                          fontSize: '15px',
                          fontWeight: 'bold',
                        }}
                        className="btn-round" color="info" type="button" outline>
                        Edit authentication factors
                      </Button>
                    </Col>
                  </Row>
                  {/* <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Col sm={12}>
                    <Button
                      onClick={() => { }}
                      style={{
                        width: "100%",
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                      className="btn-round" color="info" type="button" outline>
                      My Badges
                    </Button>
                  </Col>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Col sm={12}>
                    <Button
                      onClick={() => { }}
                      style={{
                        width: "100%",
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                      className="btn-round" color="info" type="button" outline>
                      Set up biometric authentication
                    </Button>
                  </Col>
                </Row> */}
                </>
                : <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Col sm={12}>
                    <Button
                      onClick={() => {
                        Server.sendDataToMobileApp(JSON.stringify({ message: 'web3DescriptionPage' }));
                      }}
                      style={{
                        width: "100%",
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                      className="btn-round" color="info" type="button" size="lg" outline>
                      Learn about Web 3.0 Wallet
                    </Button>
                  </Col>
                </Row>
              }
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Col sm={12}>
                  <Button
                    onClick={() => {
                      Server.sendDataToMobileApp(JSON.stringify({ message: 'homePage' }));
                    }}
                    style={{
                      width: "100%",
                      fontSize: '15px',
                      fontWeight: 'bold',
                    }}
                    className="btn-round" color="info" type="button" size="lg">
                    Done
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