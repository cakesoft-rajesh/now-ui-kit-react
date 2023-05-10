// import Web3 from "web3";
import { FaLink } from 'react-icons/fa';
import React, { Component } from "react";
// import WalletConnect from "walletconnect";
import { MdExitToApp } from 'react-icons/md';
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "components/PageSpinner";
// import membershipABI from "../../contracts_abi/membership.json";
import * as Server from "../../utils/Server";
// import * as NetworkData from 'utils/networks';
import * as GeneralFunctions from "../../utils/GeneralFunctions";

// const wc = new WalletConnect();

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
      dokuId: ''
    };
  }

  async componentDidMount() {
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    const dokuId = localStorage.getItem('dokuId');
    if (dokuId) this.setState({ dokuId });
    if (params.accessToken && params.signupMethod) {
      this.getUser(params.accessToken, params.signupMethod);
    } else if (params.walletAddress) {
      this.getUser(params.walletAddress, 'web3');
    }
  }

  // getUserInfoFromBlockchain = async (walletAddress) => {
  //   try {
  //     this.setState({ showLoader: true });
  //     let details = navigator.userAgent;
  //     let regexp = /android|iphone|kindle|ipad/i;
  //     let isMobileDevice = regexp.test(details);
  //     let provider;
  //     if (isMobileDevice) {
  //       const connector = await wc.connect();
  //       let walletConnectProvider = await wc.getWeb3Provider({
  //         rpc: { [connector.chainId]: await NetworkData.networks[connector.chainId] }
  //       });
  //       await walletConnectProvider.enable();
  //       provider = walletConnectProvider;
  //     } else {
  //       provider = Web3.givenProvider;
  //     }
  //     const web3 = new Web3(provider);
  //     const myContract = await new web3.eth.Contract(membershipABI, process.env.REACT_APP_CONTRACT_ADDRESS);
  //     const response = await myContract.methods
  //       .getUser(walletAddress)
  //       .call();
  //     if (response) {
  //       let data = await GeneralFunctions.decrypt(response);
  //       if (data) data = JSON.parse(data);
  //       this.setState({
  //         showLoader: false,
  //         email: data.email,
  //         password: data.password,
  //         firstName: data.firstName,
  //         lastName: data.lastName,
  //         phone: data.phone,
  //         displayUsername: data.displayUsername,
  //         signupMethod: 'web3',
  //         walletAddress: data.walletAddress,
  //       });
  //     }
  //   } catch (error) {
  //     this.notificationSystem.addNotification({
  //       message: error.message,
  //       level: "error",
  //     });
  //     this.setState({ showLoader: false });
  //   }
  // };

  getUser = async (accessToken, signupMethod) => {
    try {
      this.setState({ showLoader: true });
      const chainId = localStorage.getItem('chainId');
      const membershipId = process.env.REACT_APP_MEMBERSHIP_ID;
      let response = await Server.request(
        {
          url: `/user/detail?membershipId=${membershipId}&chainId=${chainId}`,
          method: "GET",
        },
        accessToken
      );
      if (response.success) {
        this.setState({
          showLoader: false,
          ...response.user,
          signupMethod
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
    // await Server.sendDataToMobileApp(JSON.stringify({ message: 'Logout successfully' }));
    await GeneralFunctions.clearFullLocalStorage();
    this.props.history.push("/login-page")
  }

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <Row>
          <Col
            sm="6"
            style={{ marginTop: 40, marginLeft: 10, marginRight: 0 }}
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
            sm={6}
            style={{
              marginTop: 10,
              marginLeft: 10,
              backgroundColor: "#e0e0e0",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              height: "auto",
            }}
          >
            {this.state.signupMethod === 'web3'
              ? <>
                <Row style={{ marginTop: 10, justifyContent: "center", alignItems: "center" }}>
                  <h6 style={{ marginTop: 15 }}>
                    {this.state.firstName ? `${this.state.firstName} ${this.state.lastName}` : null}
                  </h6>
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
                  <MdExitToApp
                    size="20"
                    style={{ cursor: 'pointer', marginBottom: '7px', marginLeft: '7px' }}
                    onClick={this.logout}
                  />
                </Row>
              </>
              : <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <h4 style={{ marginTop: 20, fontWeight: 'bold' }}>Welcome {`${this.state.firstName} ${this.state.lastName}`}</h4>
              </Row>
            }
            <Row
              style={{
                marginLeft: 0,
                marginRight: 0,
                color: "gray"
              }}
            >
              <Col xs={12}
                style={{
                  display: "flex",
                  justifyContent: 'center',
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                  Payment Id :
                </div>
                <h6 style={{ marginLeft: 5 }}>
                  {this.state.dokuId || 'Pending'}
                </h6>
              </Col>
              <Col xs={12}
                style={{
                  display: "flex",
                  justifyContent: 'center',
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                  Membership :
                </div>
                <h6 style={{ marginLeft: 5 }}>
                  {this.state.membershipStatus || 'Pending'}
                </h6>
              </Col>
            </Row>
            <Row
              style={{
                justifyContent: "center",
                marginLeft: 0,
                marginRight: 10,
              }}
            >
              <FormGroup style={{ width: "100%", marginTop: 15 }}>
                <h6>First Name</h6>
                <Input
                  disabled
                  style={{
                    marginBottom: 10,
                    width: "100%",
                    backgroundColor: "white",
                  }}
                  type="text"
                  value={this.state.firstName}
                ></Input>
                <h6>Last Name</h6>
                <Input
                  disabled
                  style={{
                    marginBottom: 10,
                    width: "100%",
                    backgroundColor: "white",
                  }}
                  type="text"
                  value={this.state.lastName}
                ></Input>
                <h6>Telephone number</h6>
                <Input
                  disabled
                  style={{
                    marginBottom: 10,
                    width: "100%",
                    backgroundColor: "white",
                  }}
                  type="text"
                  value={this.state.phone}
                ></Input>
                <h6>User name</h6>
                <Input
                  disabled
                  style={{
                    marginBottom: 10,
                    width: "100%",
                    backgroundColor: "white",
                  }}
                  type="text"
                  value={this.state.displayUsername}
                ></Input>
                <h6>Email</h6>
                <Input
                  disabled
                  style={{
                    marginBottom: 30,
                    width: "100%",
                    backgroundColor: "white",
                  }}
                  type="text"
                  value={this.state.email}
                ></Input>
              </FormGroup>
            </Row>
            <Row style={{ justifyContent: "center", alignItems: "center" }}>
              {this.state.signupMethod === 'web3'
                ? <Button
                  onClick={() => {
                    Server.sendDataToMobileApp(JSON.stringify({ message: 'myCredentialsPage' }));
                  }}
                  style={{
                    padding: '15px 30px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                  }}
                  className="btn-round" color="info" type="button" size="lg" outline>
                  My Credentials
                </Button>
                : <Button
                  onClick={() => {
                    Server.sendDataToMobileApp(JSON.stringify({ message: 'web3DescriptionPage' }));
                  }}
                  style={{
                    padding: '15px 30px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                  }}
                  className="btn-round" color="info" type="button" size="lg" outline>
                  Learn about Web 3.0 Wallet
                </Button>
              }

            </Row>
            <Row style={{ justifyContent: "center", alignItems: "center" }}>
              <Button
                onClick={() => {
                  Server.sendDataToMobileApp(JSON.stringify({ message: 'homePage' }));
                }}
                style={{
                  padding: '15px 70px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                }}
                className="btn-round" color="info" type="button" size="lg">
                Done
              </Button>
            </Row>
          </Col>
        </Row>
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