import Web3 from "web3";
import Select from "react-select";
import Copy from "copy-to-clipboard";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
// import { MdExitToApp } from "react-icons/md";
import { RiPencilLine } from "react-icons/ri";
import { FaLink, FaCopy } from "react-icons/fa";
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
  Form,
  Alert,
  Tooltip,
  Modal,
  ModalBody,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import GenerateKeyPage from "./GenerateKeyPage";
import PageSpinner from "components/PageSpinner";
import CountryCode from "../../utils/CountryCode.json";
import membershipABI from "../../contracts_abi/membership.json";
import membershipWithExpiryABI from "../../contracts_abi/membershipExpiry.json";
import * as Server from "../../utils/Server";
import * as NetworkData from "utils/networks";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

const wc = new WalletConnect();

class ProfilePage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      firstName: "",
      lastName: "",
      phone: "",
      displayUsername: "",
      email: this.props.location.state ? this.props.location.state.email : "",
      signUpByEmail: this.props.location.state ? this.props.location.state.signUpByEmail : false,
      password: this.props.location.state ? this.props.location.state.password : "",
      confirmPassword: this.props.location.state ? this.props.location.state.confirmPassword : "",
      signupMethod: this.props.location.state ? this.props.location.state.signupMethod : "",
      walletAddress: this.props.location.state ? this.props.location.state.walletAddress : "",
      privateKeyCreated: this.props.location.state ? this.props.location.state.privateKeyCreated : false,
      ztiAppName: "",
      countryCode: {
        label: "🇮🇩 +62",
        value: "62"
      },
      countryCodesOptions: [],
      rpcUrl: "https://rpc-mumbai.maticvigil.com",
      showCopyToClipboardToolTip: false,
      confirmationModal: false,
      walletConnectAlert: true,
      generateKeyPage: false,
      learnMoreDetailModal: false,
      sponserWalletAddress: "0x63eD11E0FF60A9659db396b7884733f2FdF41EB5",
      sponserPrivateKey: "bd5d9aec074c008806fa156464ab7093cd1aaf9c6f4207c8f6773f2179015e1b"
    };
  }

  async componentDidMount() {
    const ztiAppNameData = await GeneralFunctions.getZTIAppNameData();
    const countryCodesOptions = await CountryCode.map(code => ({
      label: `${code.emoji} +${code.dialingCode}`,
      value: code.dialingCode
    }))
    this.setState({ countryCodesOptions, ztiAppName: ztiAppNameData.value });
    setTimeout(() => {
      this.setState({ walletConnectAlert: false });
      clearTimeout();
    }, 5000);
  }

  signupWithExpiry = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let url; let data;
      const tokenId = new Date().getTime();
      if (this.state.signupMethod === "web3") {
        url = "/web3Auth/signup";
        data = {
          membershipWithExpiry: true,
          tokenId,
          email: this.state.email,
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          phone: `${this.state.countryCode.value}${this.state.phone}`,
          userName: `${this.state.countryCode.value}${this.state.phone}`,
          displayUsername: this.state.displayUsername,
          walletAddress: this.state.walletAddress,
          ztiAppName: this.state.ztiAppName
        };
      } else {
        url = "/web2Auth/signup";
        data = {
          membershipWithExpiry: false,
          tokenId,
          email: this.state.email,
          password: this.state.password,
          confirmPassword: this.state.confirmPassword,
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          phone: `${this.state.countryCode.value}${this.state.phone}`,
          userName: `${this.state.countryCode.value}${this.state.phone}`,
          displayUsername: this.state.displayUsername,
          ztiAppName: this.state.ztiAppName
        };
      }
      if (this.state.signupMethod === "web3") {
        let verifyDataResponse = await Server.request({
          url: "/web3Auth/verifyData",
          method: "POST",
          data
        });
        if (verifyDataResponse.success) {
          let web3;
          if (this.state.signUpByEmail) {
            web3 = new Web3(this.state.rpcUrl);
            // const keyShare1 = localStorage.getItem('keyShare1');
            // const keyShare2 = localStorage.getItem('keyShare2');
            // const privateKey = await GeneralFunctions.decrypt(`${keyShare1}${keyShare2}`);
            await web3.eth.accounts.wallet.add(this.state.sponserPrivateKey);
          } else {
            let details = navigator.userAgent;
            let regexp = /android|iphone|kindle|ipad/i;
            let isMobileDevice = regexp.test(details);
            let provider;
            if (isMobileDevice) {
              const connector = await wc.connect();
              let walletConnectProvider = await wc.getWeb3Provider({
                rpc: { [connector.chainId]: await NetworkData.networks[connector.chainId] }
              });
              await walletConnectProvider.enable();
              provider = walletConnectProvider;
            } else {
              provider = Web3.givenProvider;
            }
            web3 = new Web3(provider);
          }
          const myContract = await new web3.eth.Contract(membershipWithExpiryABI, process.env.REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY, { gas: 1000000 });
          let blockchainResponse = await myContract.methods
            .mintMembership("tokenUri", tokenId, 0)
            .send(
              {
                from: this.state.sponserWalletAddress
              }
            );
          if (blockchainResponse.status) {
            const date = new Date();
            let paymentResponse = await myContract.methods
              .payment("0xC2E56AE0EFB206cEd1F27F54D983cD1270833144")
              .send(
                {
                  from: this.state.walletAddress,
                  value: await web3.utils.toWei("0.00001", "ether")
                }
              );
            if (paymentResponse.status) {
              Object.assign(data, {
                paymentTransactionId: paymentResponse.transactionHash,
                transactionId: blockchainResponse.transactionHash,
                date,
                paymentTransactionDate: new Date(),
              });
              let response = await Server.request({
                url,
                method: "POST",
                data
              });
              if (response.success) {
                this.setState({ showLoader: false });
                localStorage.setItem("tokenId", tokenId);
                localStorage.setItem("accessToken", response.accessToken);
                await Server.sendDataToMobileApp(JSON.stringify(response));
                this.props.history.push({
                  pathname: "/profile-detail-page",
                  state: {
                    email: this.state.email,
                    password: this.state.password,
                    confirmPassword: this.state.confirmPassword,
                    firstName: this.state.firstName,
                    lastName: this.state.lastName,
                    phone: `${this.state.countryCode.value}${this.state.phone}`,
                    userName: `${this.state.countryCode.value}${this.state.phone}`,
                    displayUsername: this.state.displayUsername,
                    signupMethod: this.state.signupMethod,
                    walletAddress: this.state.walletAddress,
                    skip2FactorAuth: true
                  }
                });
              }
            }
          }
        }
      } else if (this.state.signupMethod === "web2") {
        let response = await Server.request({
          url,
          method: "POST",
          data
        });
        if (response.success) {
          this.setState({ showLoader: false });
          localStorage.setItem("signupOrLoginMethod", "web2");
          localStorage.setItem("accessToken", response.accessToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          await Server.sendDataToMobileApp(JSON.stringify(response));
          this.props.history.push({
            pathname: "/profile-detail-page",
            state: {
              email: this.state.email,
              password: this.state.password,
              confirmPassword: this.state.confirmPassword,
              firstName: this.state.firstName,
              lastName: this.state.lastName,
              phone: `${this.state.countryCode.value}${this.state.phone}`,
              userName: `${this.state.countryCode.value}${this.state.phone}`,
              displayUsername: this.state.displayUsername,
              signupMethod: this.state.signupMethod,
              walletAddress: this.state.walletAddress,
              skip2FactorAuth: true
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

  signup = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let url; let data;
      const tokenId = new Date().getTime();
      if (this.state.signupMethod === "web3") {
        url = "/web3Auth/signup";
        data = {
          membershipWithExpiry: false,
          tokenId,
          email: this.state.email,
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          phone: `${this.state.countryCode.value}${this.state.phone}`,
          userName: `${this.state.countryCode.value}${this.state.phone}`,
          displayUsername: this.state.displayUsername,
          walletAddress: this.state.walletAddress,
          ztiAppName: this.state.ztiAppName
        };
      } else {
        url = "/web2Auth/signup";
        data = {
          membershipWithExpiry: false,
          tokenId,
          email: this.state.email,
          password: this.state.password,
          confirmPassword: this.state.confirmPassword,
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          phone: `${this.state.countryCode.value}${this.state.phone}`,
          userName: `${this.state.countryCode.value}${this.state.phone}`,
          displayUsername: this.state.displayUsername,
          ztiAppName: this.state.ztiAppName
        };
      }
      if (this.state.signupMethod === "web3") {
        let verifyDataResponse = await Server.request({
          url: "/web3Auth/verifyData",
          method: "POST",
          data
        });
        if (verifyDataResponse.success) {
          let web3;
          if (this.state.signUpByEmail) {
            web3 = new Web3(this.state.rpcUrl);
            // const keyShare1 = localStorage.getItem('keyShare1');
            // const keyShare2 = localStorage.getItem('keyShare2');
            // const privateKey = await GeneralFunctions.decrypt(`${keyShare1}${keyShare2}`);
            await web3.eth.accounts.wallet.add(this.state.sponserPrivateKey);
          } else {
            let provider;
            let details = navigator.userAgent;
            let regexp = /android|iphone|kindle|ipad/i;
            let isMobileDevice = regexp.test(details);
            if (isMobileDevice) {
              const connector = await wc.connect();
              let walletConnectProvider = await wc.getWeb3Provider({
                rpc: { [connector.chainId]: await NetworkData.networks[connector.chainId] }
              });
              await walletConnectProvider.enable();
              provider = walletConnectProvider;
            } else {
              provider = Web3.givenProvider;
            }
            web3 = new Web3(provider);
          }
          const myContract = await new web3.eth.Contract(membershipABI, process.env.REACT_APP_CONTRACT_ADDRESS, { gas: 1000000 });
          let blockchainResponse = await myContract.methods
            .mintMembership("tokenURI", tokenId)
            .send(
              {
                from: this.state.sponserWalletAddress
              }
            );
          if (blockchainResponse.status) {
            Object.assign(data, {
              transactionId: blockchainResponse.transactionHash,
              date: new Date(),
            });
            let response = await Server.request({
              url,
              method: "POST",
              data
            });
            if (response.success) {
              this.setState({ showLoader: false });
              localStorage.setItem("tokenId", tokenId);
              localStorage.setItem("accessToken", response.accessToken);
              await Server.sendDataToMobileApp(JSON.stringify(response));
              this.props.history.push({
                pathname: "/profile-detail-page",
                state: {
                  email: this.state.email,
                  password: this.state.password,
                  confirmPassword: this.state.confirmPassword,
                  firstName: this.state.firstName,
                  lastName: this.state.lastName,
                  phone: `${this.state.countryCode.value}${this.state.phone}`,
                  userName: `${this.state.countryCode.value}${this.state.phone}`,
                  displayUsername: this.state.displayUsername,
                  signupMethod: this.state.signupMethod,
                  walletAddress: this.state.walletAddress,
                  skip2FactorAuth: true
                }
              });
            }
          }
        }
      } else if (this.state.signupMethod === "web2") {
        let response = await Server.request({
          url,
          method: "POST",
          data
        });
        if (response.success) {
          this.setState({ showLoader: false });
          localStorage.setItem("signupOrLoginMethod", "web2");
          localStorage.setItem("accessToken", response.accessToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          await Server.sendDataToMobileApp(JSON.stringify(response));
          this.props.history.push({
            pathname: "/profile-detail-page",
            state: {
              email: this.state.email,
              password: this.state.password,
              confirmPassword: this.state.confirmPassword,
              firstName: this.state.firstName,
              lastName: this.state.lastName,
              phone: `${this.state.countryCode.value}${this.state.phone}`,
              userName: `${this.state.countryCode.value}${this.state.phone}`,
              displayUsername: this.state.displayUsername,
              signupMethod: this.state.signupMethod,
              walletAddress: this.state.walletAddress,
              skip2FactorAuth: true
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

  handleSubmit = (event) => {
    event.preventDefault();
    this.toggleConfirmationModal();
  }

  logout = async () => {
    await Server.sendDataToMobileApp(JSON.stringify({ message: 'Logout successfully' }));
    if (this.state.signupMethod === "web3" && localStorage.getItem("signIn")) {
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

  toggleConfirmationModal = () => {
    this.setState({ confirmationModal: !this.state.confirmationModal });
  };

  toggleGenerateKeyPage = () => {
    this.setState({ generateKeyPage: !this.state.generateKeyPage });
  };

  toggleLearnMoreDetailModal = () => {
    this.setState({ learnMoreDetailModal: !this.state.learnMoreDetailModal });
  };

  updateStateValue = (value) => this.setState(value);

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <>{this.state.generateKeyPage &&
              <GenerateKeyPage
                {...this.props}
                email={this.state.email}
                walletAddress={this.state.walletAddress}
                updateStateValue={this.updateStateValue}
              />
            }
              {!this.state.generateKeyPage &&
                <Row>
                  <Col
                    sm="12"
                    style={{ marginTop: 40, marginLeft: 10, marginRight: 0 }}
                  >
                    {
                      this.state.walletAddress
                      &&
                      <Row style={{ justifyContent: "center", alignItems: "center" }}>
                        <Alert
                          isOpen={this.state.walletConnectAlert}
                          style={{
                            fontSize: "15px",
                            fontWeight: "bold",
                            background: "#919799",
                            borderRadius: "30px",
                            padding: "5px 20px",
                          }}
                        >
                          Success! Your Wallet is Connected
                        </Alert>
                      </Row>
                    }
                    <Row style={{ justifyContent: "center", alignItems: "center" }}>
                      <Col sm={12} style={{ textAlign: "center" }}>
                        <h2 style={{ color: "#275996", margin: 0, fontWeight: 600 }}>Welcome!</h2>
                      </Col>
                      <Col sm={12} style={{ textAlign: "center" }}>
                        <h5 style={{ color: "#275996", margin: 0, fontWeight: 600 }}>Let"s set up your profile</h5>
                      </Col>
                    </Row>
                    <Row
                      style={{
                        marginTop: 20,
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
                        }}
                      >
                        <div
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: 40,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#2CA8FF",
                          }}
                        >
                          <div
                            className="alert-icon"
                            style={{ marginLeft: 0, marginRight: 0, display: "flex" }}
                          >
                            <i
                              className="now-ui-icons users_single-02"
                              style={{ color: "white", fontSize: "24px" }}
                            ></i>
                          </div>
                        </div>
                        <h6 style={{ color: "gray", marginLeft: 5, marginBottom: 0 }}>Add Avatar</h6>
                        <div style={{ marginLeft: 5, marginRight: 0, marginBottom: 0 }}>
                          <RiPencilLine />
                        </div>
                      </Row>
                      <Row
                        style={{
                          marginLeft: 0,
                          marginTop: 5,
                          marginRight: 0,
                          display: "flex",
                          alignItems: "center",
                          width: "100%"
                        }}
                      >
                        <label
                          style={{
                            marginBottom: 0,
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
                      marginTop: 5,
                      backgroundColor: "#e0e0e0",
                      borderTopLeftRadius: 30,
                      borderTopRightRadius: 30
                    }}
                  >
                    {this.state.signupMethod === "web3"
                      && <>
                        <h6 style={{ marginTop: 20, color: "gray" }}>Connected Web3 Wallet</h6>
                        <Row
                          style={{
                            marginLeft: 0,
                            marginRight: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div style={{
                            marginRight: 0,
                            marginBottom: 10,
                            border: "1px solid #275996",
                            borderRadius: " 15px",
                            padding: "6px",
                            background: "#275996",
                            display: "flex",
                            justifyContent: " center",
                            alignItems: " center",
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
                          {/* <MdExitToApp
                      size="20"
                      style={{ cursor: "pointer", marginBottom: "7px", marginLeft: "7px" }}
                      onClick={this.logout}
                    /> */}
                        </Row>
                      </>
                    }
                    <Form onSubmit={this.handleSubmit}>
                      <Row
                        style={{
                          justifyContent: "center",
                          marginLeft: 0,
                          marginRight: 10,
                        }}
                      >
                        <FormGroup style={{ width: "100%", marginTop: 15 }}>
                          <h6>First Name(individual or business)</h6>
                          <Input
                            style={{
                              marginBottom: 10,
                              width: "100%",
                              backgroundColor: "white",
                            }}
                            placeholder="Enter first name"
                            type="text"
                            required
                            value={this.state.firstName}
                            onChange={(event) => this.setState({ firstName: event.target.value })}
                          ></Input>
                          <h6>Last Name(individual or business)</h6>
                          <Input
                            style={{
                              marginBottom: 10,
                              width: "100%",
                              backgroundColor: "white",
                            }}
                            placeholder="Enter last name"
                            type="text"
                            required
                            value={this.state.lastName}
                            onChange={(event) => this.setState({ lastName: event.target.value })}
                          ></Input>
                          <h6>Telephone number</h6>
                          <Row>
                            <Col xs={4} className="pr-0 pl-0">
                              <Select
                                styles={{
                                  control: (baseStyles) => ({
                                    ...baseStyles,
                                    borderRadius: "30px",
                                    fontSize: "0.8571em",
                                    color: "#E3E3E3"
                                  })
                                }}
                                value={this.state.countryCode}
                                onChange={(result) => this.setState({ countryCode: result })}
                                options={this.state.countryCodesOptions}
                                required
                                placeholder="Code"
                              />
                            </Col>
                            <Col xs={8} className="pr-0">
                              <Input
                                style={{
                                  marginBottom: 10,
                                  width: "100%",
                                  backgroundColor: "white",
                                }}
                                placeholder="Enter telephone number"
                                type="text"
                                required
                                value={this.state.phone}
                                onChange={(event) => this.setState({ phone: event.target.value })}
                              ></Input>
                            </Col>
                          </Row>
                          <h6>User name</h6>
                          <Input
                            style={{
                              marginBottom: 10,
                              width: "100%",
                              backgroundColor: "white",
                            }}
                            placeholder="Enter username"
                            type="text"
                            required
                            value={this.state.displayUsername}
                            onChange={(event) => this.setState({ displayUsername: event.target.value })}
                          ></Input>
                          <h6>Email</h6>
                          <Input
                            style={{
                              marginBottom: 30,
                              width: "100%",
                              backgroundColor: "white",
                            }}
                            placeholder="Enter email"
                            type="email"
                            required
                            value={this.state.email}
                            disabled={this.state.signUpByEmail}
                            onChange={(event) => this.setState({ email: event.target.value })}
                          ></Input>
                        </FormGroup>
                      </Row>
                      {!this.state.privateKeyCreated &&
                        <>
                          <Row style={{ justifyContent: "center", alignItems: "center" }}>
                            <Col sm={12}>
                              <Button
                                style={{
                                  width: "100%",
                                  fontSize: '15px',
                                  fontWeight: 'bold',
                                }}
                                outline
                                color="info"
                                type="button"
                                className="btn-round"
                                onClick={this.toggleGenerateKeyPage}
                              >
                                Set authentication factors for future login and to seamlessly switch devices
                              </Button>
                            </Col>
                          </Row>
                          <Row style={{ justifyContent: "center", alignItems: "center" }}>
                            <label
                              style={{
                                color: "gray",
                                margin: 0,
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                              onClick={this.toggleLearnMoreDetailModal}
                            >
                              Learn More
                            </label>
                          </Row>
                        </>
                      }
                      <Row style={{ justifyContent: "center", alignItems: "center" }}>
                        <Col sm={12}>
                          <Button
                            style={{
                              width: "100%",
                              fontSize: '15px',
                              fontWeight: 'bold',
                            }}
                            color="info"
                            type="submit"
                            className="btn-round"
                            disabled={!this.state.privateKeyCreated}
                          >
                            Done
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                </Row >
              }
            </>
        }
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
        {this.state.confirmationModal
          && <Modal
            size="sm"
            modalClassName="modal-mini modal-info"
            style={{ marginTop: "20%" }}
            toggle={this.toggleConfirmationModal}
            isOpen={this.state.confirmationModal}
          >
            <ModalBody>
              <label
                style={{
                  color: "gray",
                  fontSize: "15px",
                  fontWeight: 500
                }}
              >
                Your Profile information will be shared with:
              </label>
              <label
                style={{
                  color: "gray",
                  marginTop: 20,
                  fontWeight: 600,
                  fontSize: "15px",
                }}
              >
                ZTI to verify your digital membership credential
              </label>
              <label
                style={{
                  color: "gray",
                  marginTop: 20,
                  fontWeight: 600,
                  fontSize: "15px",
                }}
              >
                Payment Technology DOKU to establish a digital gateway credential
              </label>
              <div>
                <Button
                  style={{
                    padding: 0,
                    float: "left",
                    color: "gray",
                    fontWeight: 500,
                    fontSize: "20px",
                    boxShadow: "unset",
                    background: "transparent",
                    margin: "25px 0px 0px 0px",
                  }}
                  onClick={this.toggleConfirmationModal}
                >
                  Cancel
                </Button>
                <Button
                  style={{
                    padding: 0,
                    color: "gray",
                    float: "right",
                    fontWeight: 500,
                    fontSize: "20px",
                    boxShadow: "unset",
                    margin: "25px 0px 0px 0px",
                    background: "transparent",
                  }}
                  onClick={(event) => GeneralFunctions.getMembershipWithExpiry()
                    ? this.signupWithExpiry(event)
                    : this.signup(event)
                  }
                >
                  OK
                </Button>
              </div>
            </ModalBody>
          </Modal>
        }
        {this.state.learnMoreDetailModal
          && <Modal
            size="sm"
            modalClassName="modal-mini modal-info"
            style={{ marginTop: "20%" }}
            toggle={this.toggleLearnMoreDetailModal}
            isOpen={this.state.learnMoreDetailModal}
          >
            <ModalBody>
              <label
                style={{
                  color: "gray",
                  fontSize: "17px",
                  fontWeight: 500
                }}
              >
                Setting Authentication Factors allows you to switch to a new device seamlessly
              </label>
              <div>
                <Button
                  style={{
                    color: "gray",
                    background: "transparent",
                    fontWeight: 500,
                    fontSize: "20px",
                    float: "right",
                    padding: 0,
                    margin: "20px 0px 0px 0px",
                    boxShadow: "unset"
                  }}
                  onClick={this.toggleLearnMoreDetailModal}
                >
                  OK
                </Button>
              </div>
            </ModalBody>
          </Modal>
        }
      </>
    );
  }
}

export default ProfilePage;