import Web3 from "web3";
import Swal from 'sweetalert2';
import Select from "react-select";
import Copy from "copy-to-clipboard";
import Cropper from 'react-easy-crop'
import OtpInput from "react-otp-input";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import { RiPencilLine } from "react-icons/ri";
import { FaLink, FaCopy } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { BottomSheet } from "react-spring-bottom-sheet"
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
  InputGroup,
  InputGroupText,
  ModalFooter,
} from "reactstrap";
import getCroppedImg from '../../utils/CropImage';
import PageSpinner from "components/PageSpinner";
import CountryCode from "../../utils/CountryCode.json";
import membershipABI from "../../contracts_abi/membership.json";
import config from "../../config";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"

const wc = new WalletConnect();

class ProfilePage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      firstName: "",
      lastName: "",
      phone: "",
      phoneVerified: false,
      displayUsername: "",
      email: this.props.location.state ? this.props.location.state.email : "",
      signUpByEmail: this.props.location.state ? this.props.location.state.signUpByEmail : false,
      walletAddress: this.props.location.state ? this.props.location.state.walletAddress : "",
      ztiAppName: "",
      countryCode: {
        label: "🇮🇩 +62",
        value: "62"
      },
      countryCodesOptions: [],
      rpcUrl: config.rpcUrl,
      showCopyToClipboardToolTip: false,
      confirmationModal: false,
      walletConnectAlert: true,
      sponserWalletAddress: config.sponserWalletAddress,
      sponserPrivateKey: config.sponserPrivateKey,
      file: "",
      fileName: "",
      fileData: "",
      recoveryPassword: "",
      keyShare1: localStorage.getItem("keyShare1"),
      keyShare2: localStorage.getItem("keyShare2"),
      showPassword: false,
      imageCropModal: false,
      crop: { x: 0, y: 0 },
      zoom: 1,
      aspect: 1,
      croppedImage: null,
      croppedAreaPixels: null,
      showSheetForOTP: false,
      otp: ""
    };
  }

  async componentDidMount() {
    const profileData = await GeneralFunctions.getProfileData();
    if (profileData) this.setState(profileData);
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

  sendPhoneOTP = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/phone/sendOTP",
        method: "POST",
        data: {
          phone: `${this.state.countryCode.value}${this.state.phone}`
        }
      });
      if (response.success) {
        this.setState({
          showLoader: false,
          showSheetForOTP: true
        });
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

  verifyPhoneOTP = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/phone/verifyOTP",
        method: "POST",
        data: {
          phone: `${this.state.countryCode.value}${this.state.phone}`,
          otp: this.state.otp
        }
      });
      if (response.success) {
        this.setState({
          showLoader: false,
          phoneVerified: true,
          showSheetForOTP: false,
          confirmationModal: true
        });
      }
    } catch (error) {
      this.setState({
        showLoader: false,
        showSheetForOTP: false
      });
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "OK",
        confirmButtonColor: "#2CA8FF"
      }).then(result => result.isConfirmed && this.setState({ showSheetForOTP: true }));
    }
  };

  signup = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      const tokenId = new Date().getTime();
      let url = "/web3Auth/signup";
      let data = {
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
      let verifyDataResponse = await Server.request({
        url: "/web3Auth/verifyData",
        method: "POST",
        data
      });
      if (verifyDataResponse.success) {
        let web3;
        if (this.state.signUpByEmail) {
          web3 = new Web3(this.state.rpcUrl);
          // const keyShare1 = localStorage.getItem("keyShare1");
          // const keyShare2 = localStorage.getItem("keyShare2");
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
              rpc: { [connector.chainId]: await config.networks[connector.chainId] }
            });
            await walletConnectProvider.enable();
            provider = walletConnectProvider;
          } else {
            provider = Web3.givenProvider;
          }
          web3 = new Web3(provider);
        }
        const gasPrice = await new web3.eth.getGasPrice();
        const myContract = await new web3.eth.Contract(membershipABI, config.REACT_APP_CONTRACT_ADDRESS, { gas: 1000000, gasPrice });
        let blockchainResponse;
        try {
          blockchainResponse = await myContract.methods
            .mintMembership("tokenURI", tokenId)
            .send(
              {
                from: this.state.sponserWalletAddress
              }
            );
        } catch (error) {
          this.setState({ showLoader: false });
          Swal.fire({
            icon: "error",
            text: `Blockchain error - ${error.message}`,
            confirmButtonText: "OK",
            confirmButtonColor: "#2CA8FF"
          });
        }
        if (blockchainResponse && blockchainResponse.status) {
          Object.assign(data, {
            transactionId: blockchainResponse.transactionHash,
            date: new Date(),
          });
          let setPasswordAndRegisterKeyResponse = await Server.request({
            url: "/web3Auth/setPasswordAndRegisterKey",
            method: "POST",
            data: {
              email: this.state.email,
              password: this.state.recoveryPassword,
              confirmPassword: this.state.recoveryPassword,
              keyShare1: this.state.keyShare1,
              keyShare2: this.state.keyShare2,
              walletAddress: this.state.walletAddress
            }
          });
          if (setPasswordAndRegisterKeyResponse.success) {
            let response = await Server.request({
              url,
              method: "POST",
              data
            });
            if (response.success) {
              localStorage.setItem("tokenId", tokenId);
              localStorage.setItem("accessToken", response.accessToken);
              if (this.state.croppedImage) {
                let formData = new FormData();
                let blobData = await fetch(this.state.croppedImage).then(res => res.blob());
                formData.append("image", blobData);
                formData.append("username", `${this.state.countryCode.value}${this.state.phone}`);
                await Server.postWithFormData(
                  "/api/v1/setAvatar",
                  formData,
                  response.accessToken
                );
              }
              Object.assign(response, { message: "User Account Created" });
              await Server.sendDataToMobileApp(JSON.stringify(response));
            }
          }
        }
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

  handleSubmit = (event) => {
    event.preventDefault();
    this.toggleConfirmationModal();
  }

  handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    this.setState({
      file: fileUploaded,
      fileName: fileUploaded.name,
    });
    this.previewFile(fileUploaded, (fileData) => {
      this.setState({ fileData });
    });
    event.target.value = "";
    this.toggleImageCropModal();
  };

  previewFile = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(file);
  };

  onCropChange = (crop) => {
    this.setState({ crop })
  };

  onCropComplete = (croppedArea, croppedAreaPixels) => {
    this.setState({ croppedAreaPixels })
  };

  onZoomChange = (zoom) => {
    this.setState({ zoom })
  };

  showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(
        this.state.fileData,
        this.state.croppedAreaPixels,
        0
      );
      this.setState({ croppedImage }, () => this.toggleImageCropModal());
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: error.message || error,
        confirmButtonText: "OK",
        confirmButtonColor: "#2CA8FF"
      });
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
    await GeneralFunctions.clearFullLocalStorage();
    this.props.history.push("/select-community-page");
  };

  toggleConfirmationModal = () => {
    this.setState({ confirmationModal: !this.state.confirmationModal });
  };

  toggleImageCropModal = () => {
    this.setState({ imageCropModal: !this.state.imageCropModal });
  };

  validateData = () => {
    if (
      this.state.firstName &&
      this.state.lastName &&
      this.state.phone &&
      this.state.displayUsername &&
      this.state.email &&
      this.state.recoveryPassword
    ) {
      return false;
    } else {
      return true;
    }
  };

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <Row>
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
                    {this.state.croppedImage
                      ? <img
                        style={{
                          height: "50px",
                          width: "50px",
                          borderRadius: "50%",
                          verticalAlign: "middle"
                        }}
                        src={this.state.croppedImage}
                        alt=""
                      />
                      : <div
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
                    }
                    <label
                      htmlFor="imgupload"
                      style={{
                        marginBottom: 0,
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                    >
                      <h6 style={{ color: "gray", marginLeft: 5, marginBottom: 0 }}>Add Avatar</h6>
                      <RiPencilLine
                        style={{ marginLeft: 5 }}
                      />
                    </label>
                    <input
                      type="file"
                      id="imgupload"
                      style={{ display: "none" }}
                      accept=".png,.jpg,.jpeg"
                      onChange={this.handleChange}
                    />
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
                </Row>
                <Form onSubmit={this.sendPhoneOTP}>
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
                          fontSize: "15px"
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
                          fontSize: "15px"
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
                                fontSize: "15px",
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
                              fontSize: "15px"
                            }}
                            placeholder="Enter telephone number"
                            type="text"
                            required
                            value={this.state.phone}
                            disabled={this.state.phoneVerified}
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
                          fontSize: "15px"
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
                          marginBottom: 10,
                          width: "100%",
                          backgroundColor: "white",
                          fontSize: "15px"
                        }}
                        placeholder="Enter email"
                        type="email"
                        required
                        value={this.state.email}
                        disabled={this.state.signUpByEmail}
                        onChange={(event) => this.setState({ email: event.target.value })}
                      ></Input>
                      <h6>CREATE A RECOVERY PASSWORD FOR CHANGING DEVICES</h6>
                      <InputGroup>
                        <Input
                          style={{
                            marginBottom: 10,
                            border: "transparent",
                            color: "black",
                            background: "white",
                            fontSize: "15px"
                          }}
                          value={this.state.recoveryPassword}
                          placeholder="Create Recovery Password"
                          type={this.state.showPassword ? "text" : "password"}
                          required
                          onChange={(event) => this.setState({ recoveryPassword: event.target.value })}
                        ></Input>
                        <InputGroupText
                          style={{
                            border: "transparent",
                            borderTopLeftRadius: "0px",
                            borderBottomLeftRadius: "0px",
                            background: "rgb(198, 198, 198)",
                            padding: "0px 20px",
                            height: "40px"
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
                    </FormGroup>
                  </Row>
                  <Row style={{ justifyContent: "center", alignItems: "center" }}>
                    <Col sm={12}>
                      <Button
                        style={{
                          width: "100%",
                          fontSize: "15px",
                          fontWeight: "bold",
                        }}
                        color="info"
                        type="submit"
                        className="btn-round"
                        disabled={this.validateData()}
                      >
                        Done
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Col>
            </Row >
        }
        {
          this.state.confirmationModal
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
                  onClick={(event) => this.signup(event)}
                >
                  OK
                </Button>
              </div>
            </ModalBody>
          </Modal>
        }
        {
          this.state.imageCropModal
          && <Modal
            size="md"
            style={{ marginTop: "20%" }}
            toggle={this.toggleImageCropModal}
            isOpen={this.state.imageCropModal}
          >
            <ModalBody style={{ width: "100%", height: "200px" }}>
              <Cropper
                image={this.state.fileData}
                crop={this.state.crop}
                zoom={this.state.zoom}
                aspect={this.state.aspect}
                onCropChange={this.onCropChange}
                onCropComplete={this.onCropComplete}
                onZoomChange={this.onZoomChange}
              />
            </ModalBody>
            <ModalFooter style={{ justifyContent: "center", padding: 0 }}>
              <Button
                onClick={this.showCroppedImage}
                style={{
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
                className="btn-round" color="info" type="button" size="lg">
                Crop Image
              </Button>
            </ModalFooter>
          </Modal>
        }
        <BottomSheet
          expandOnContentDrag={true}
          open={this.state.showSheetForOTP}
          snapPoints={({ minHeight, maxHeight }) => [
            minHeight + 20,
            maxHeight - maxHeight / 3
          ]}
        >
          <style>
            {`[data-rsbs-overlay] {
            background: #2CA8FF;
          }`}
          </style>
          <Row
            style={{
              margin: "20px 20px 0px"
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              A verification code will be sent to your mobile via text message
            </div>
          </Row>
          <Row
            style={{
              margin: "10px 20px 0px"
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Enter the code
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "10px 20px 0px"
            }}
          >
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
              separator={<span style={{ color: "#fff" }}>-</span>}
            />
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginTop: 15,
            }}
          >
            <div
              style={{
                color: "#e9e5e5",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
              onClick={this.sendPhoneOTP}
            >
              Resend Code
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Button
              style={{
                padding: "10px 29px",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "rgb(81 75 75)",
              }}
              onClick={this.verifyPhoneOTP}
              className="btn-round mr-2"
              color="black"
              type="button"
              size="lg"
            >
              Verify Code
            </Button>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>

          </Row>
        </BottomSheet>
      </>
    );
  }
}

export default ProfilePage;