// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

enum AccessType {
    None,
    Expiry,
    D2C,
    Full
}

enum PaymentMode {
    ETH,
    USDT,
    CLUSTER,
    CUSTOM_TOKEN
}

struct ExpiryTier {
    uint256 price;
    uint256 expiryDays;
}

struct PriceInfo {
    uint256 fullAccessPrice;
    uint256 d2cAccessPrice;
}

struct Dataset {
    string name;
    string description;
    string uri;
    uint256 version;
    bool active;
    PaymentMode paymentMode;
    address customTokenAddress;
    PriceInfo prices;
    ExpiryTier[] expiryTiers;
    uint256 fullBuyPrice;
    bool customTokenEnabled;
    bool fullBuyEnabled;
}

struct Access {
    AccessType accessType;
    uint256 expiryTime;
    bool active;
}

contract DatasetTokenUpgradeable is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 public datasetId;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 _datasetId,
        uint256 initialSupply,
        address initialOwner
    ) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        datasetId = _datasetId;
        _mint(initialOwner, initialSupply);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}

contract DatasetNFTUpgradeable is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    address public factory;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __ERC721_init("Dataset NFT", "DNFT");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        factory = msg.sender;
    }

    function mint(address to, uint256 tokenId) external {
        require(msg.sender == factory, "Only factory can mint");
        _safeMint(to, tokenId);
    }

    function setFactory(address _factory) external onlyOwner {
        factory = _factory;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}

contract DatasetFactoryUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 public _datasetIds;
    mapping(uint256 => Dataset) public datasets;
    mapping(address => mapping(uint256 => Access)) public accessRights;

    address public nftContract;
    address public usdtAddress;
    address public clusterAddress;
    address public tokenImplementation;

    event DatasetCreated(
        uint256 indexed datasetId,
        string name,
        address owner,
        PaymentMode paymentMode,
        address customTokenAddress
    );
    event AccessGranted(
        address indexed user,
        uint256 indexed datasetId,
        AccessType accessType
    );

    event AccessRevoked(address indexed user, uint256 indexed datasetId);
    event URIUpdated(uint256 indexed datasetId, string newUri, uint256 version);
    event FullDatasetPurchased(
        uint256 indexed datasetId,
        address indexed buyer
    );
    event FullBuyPriceUpdated(uint256 indexed datasetId, uint256 newPrice);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _nftContract,
        address _usdtAddress,
        address _clusterAddress
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        nftContract = _nftContract;
        usdtAddress = _usdtAddress;
        clusterAddress = _clusterAddress;

        // Deploy the token implementation
        DatasetTokenUpgradeable tokenImpl = new DatasetTokenUpgradeable();
        tokenImplementation = address(tokenImpl);
    }

    function createDataset(
        string memory name,
        string memory description,
        string memory uri,
        PaymentMode paymentMode,
        PriceInfo memory prices,
        ExpiryTier[] memory _expiryTiers,
        uint256 _fullBuyPrice,
        bool _customTokenEnabled,
        bool _fullBuyEnabled,
        uint256 customTokenSupply
    ) external returns (uint256) {
        // Validation checks
        require(
            !(_customTokenEnabled && _fullBuyEnabled),
            "Custom token and full buy cannot be enabled simultaneously"
        );

        // Increment dataset ID
        _datasetIds++;
        uint256 newDatasetId = _datasetIds;

        // Handle custom token deployment
        address customTokenAddress = address(0);
        if (paymentMode == PaymentMode.CUSTOM_TOKEN) {
            string memory tokenName = string(
                abi.encodePacked("Dataset Token ", name)
            );
            string memory tokenSymbol = string(abi.encodePacked("DT", name));

            bytes memory initData = abi.encodeWithSelector(
                DatasetTokenUpgradeable.initialize.selector,
                tokenName,
                tokenSymbol,
                newDatasetId,
                customTokenSupply,
                msg.sender
            );

            ERC1967Proxy proxy = new ERC1967Proxy(
                tokenImplementation,
                initData
            );
            customTokenAddress = address(proxy);
        }

        // Create dataset with storage reference
        Dataset storage dataset = datasets[newDatasetId];

        // Manually set all dataset properties
        dataset.name = name;
        dataset.description = description;
        dataset.uri = uri;
        dataset.version = 1;
        dataset.active = true;
        dataset.paymentMode = paymentMode;
        dataset.customTokenAddress = customTokenAddress;
        dataset.prices = prices;
        dataset.fullBuyPrice = _fullBuyPrice;
        dataset.customTokenEnabled = _customTokenEnabled;
        dataset.fullBuyEnabled = _fullBuyEnabled;

        // Clear existing expiry tiers if any
        delete dataset.expiryTiers;

        // Manually add expiry tiers
        for (uint i = 0; i < _expiryTiers.length; i++) {
            dataset.expiryTiers.push(
                ExpiryTier({
                    price: _expiryTiers[i].price,
                    expiryDays: _expiryTiers[i].expiryDays
                })
            );
        }

        // Mint NFT for the dataset
        DatasetNFTUpgradeable(nftContract).mint(msg.sender, newDatasetId);

        // Emit creation event
        emit DatasetCreated(
            newDatasetId,
            name,
            msg.sender,
            paymentMode,
            customTokenAddress
        );

        return newDatasetId;
    }

    function purchaseAccess(
        uint256 datasetId,
        AccessType accessType
    ) external payable {
        Dataset storage dataset = datasets[datasetId];
        require(dataset.active, "Dataset is not active");

        uint256 price;
        if (accessType == AccessType.Full) {
            price = dataset.prices.fullAccessPrice;
        } else if (accessType == AccessType.D2C) {
            price = dataset.prices.d2cAccessPrice;
        } else if (accessType == AccessType.Expiry) {
            require(
                dataset.expiryTiers.length > 0,
                "No expiry tiers available"
            );
            // For simplicity, using the first expiry tier's price
            price = dataset.expiryTiers[0].price;
        } else {
            revert("Invalid access type");
        }

        address datasetOwner = DatasetNFTUpgradeable(nftContract).ownerOf(
            datasetId
        );

        // Handle payment based on payment mode
        if (dataset.paymentMode == PaymentMode.ETH) {
            require(msg.value == price, "Incorrect ETH amount");
            payable(datasetOwner).transfer(msg.value);
        } else if (dataset.paymentMode == PaymentMode.USDT) {
            require(msg.value == 0, "ETH not accepted for this dataset");
            require(
                IERC20(usdtAddress).transferFrom(
                    msg.sender,
                    datasetOwner,
                    price
                ),
                "USDT transfer failed"
            );
        } else if (dataset.paymentMode == PaymentMode.CLUSTER) {
            require(msg.value == 0, "ETH not accepted for this dataset");
            require(
                IERC20(clusterAddress).transferFrom(
                    msg.sender,
                    datasetOwner,
                    price
                ),
                "CLUSTER transfer failed"
            );
        } else if (dataset.paymentMode == PaymentMode.CUSTOM_TOKEN) {
            require(msg.value == 0, "ETH not accepted for this dataset");
            require(
                dataset.customTokenAddress != address(0),
                "Custom token not set"
            );

            // Using specific DatasetTokenUpgradeable type
            DatasetTokenUpgradeable customToken = DatasetTokenUpgradeable(
                dataset.customTokenAddress
            );
            require(
                customToken.transferFrom(msg.sender, datasetOwner, price),
                "Dataset token transfer failed"
            );
        } else {
            revert("Invalid payment mode");
        }

        // Grant access
        uint256 expiryTime = accessType == AccessType.Expiry
            ? block.timestamp + dataset.expiryTiers[0].expiryDays * 1 days
            : type(uint256).max;

        accessRights[msg.sender][datasetId] = Access({
            accessType: accessType,
            expiryTime: expiryTime,
            active: true
        });

        emit AccessGranted(msg.sender, datasetId, accessType);
    }

    function purchaseFullDataset(uint256 datasetId) external payable {
        Dataset storage dataset = datasets[datasetId];
        require(dataset.active, "Dataset is not active");
        require(dataset.fullBuyEnabled, "Full buy option is not enabled");

        address datasetOwner = DatasetNFTUpgradeable(nftContract).ownerOf(
            datasetId
        );

        // Check if the contract is approved to transfer the NFT
        require(
            DatasetNFTUpgradeable(nftContract).isApprovedForAll(
                datasetOwner,
                address(this)
            ) ||
                DatasetNFTUpgradeable(nftContract).getApproved(datasetId) ==
                address(this),
            "Dataset not approved for transfer"
        );

        // Handle payment based on payment mode
        if (dataset.paymentMode == PaymentMode.ETH) {
            require(msg.value == dataset.fullBuyPrice, "Incorrect ETH amount"); // Changed to exact amount
            payable(datasetOwner).transfer(msg.value);
        } else if (dataset.paymentMode == PaymentMode.USDT) {
            require(msg.value == 0, "ETH not accepted for this dataset");
            require(
                IERC20(usdtAddress).transferFrom(
                    msg.sender,
                    datasetOwner,
                    dataset.fullBuyPrice
                ),
                "USDT transfer failed"
            );
        } else if (dataset.paymentMode == PaymentMode.CLUSTER) {
            require(msg.value == 0, "ETH not accepted for this dataset");
            require(
                IERC20(clusterAddress).transferFrom(
                    msg.sender,
                    datasetOwner,
                    dataset.fullBuyPrice
                ),
                "CLUSTER transfer failed"
            );
        } else {
            revert("Invalid payment mode for full buy");
        }

        // Transfer ownership of the dataset to the buyer
        DatasetNFTUpgradeable(nftContract).safeTransferFrom(
            datasetOwner,
            msg.sender,
            datasetId
        );

        emit FullDatasetPurchased(datasetId, msg.sender);
    }

    function checkAccess(
        address user,
        uint256 datasetId
    ) public view returns (bool hasAccess, AccessType accessType) {
        Access memory access = accessRights[user][datasetId];

        // Check if access is active and valid
        hasAccess =
            access.active &&
            (access.accessType == AccessType.Full ||
                access.accessType == AccessType.D2C ||
                (access.accessType == AccessType.Expiry &&
                    block.timestamp <= access.expiryTime));

        // Return the access type regardless of whether it's active/valid
        accessType = access.accessType;
    }

    function revokeAccess(address user, uint256 datasetId) external {
        require(
            msg.sender == DatasetNFTUpgradeable(nftContract).ownerOf(datasetId),
            "Only dataset owner can revoke access"
        );
        require(
            accessRights[user][datasetId].active,
            "No active access rights"
        );

        accessRights[user][datasetId].active = false;
        emit AccessRevoked(user, datasetId);
    }

    function updateDatasetURI(
        uint256 datasetId,
        string memory newUri
    ) external {
        require(
            msg.sender == DatasetNFTUpgradeable(nftContract).ownerOf(datasetId),
            "Only dataset owner can update URI"
        );
        Dataset storage dataset = datasets[datasetId];
        dataset.uri = newUri;
        dataset.version += 1;
        emit URIUpdated(datasetId, newUri, dataset.version);
    }

    function updateFullBuyPrice(uint256 datasetId, uint256 newPrice) external {
        require(
            msg.sender == DatasetNFTUpgradeable(nftContract).ownerOf(datasetId),
            "Only dataset owner can update full buy price"
        );
        datasets[datasetId].fullBuyPrice = newPrice;
        emit FullBuyPriceUpdated(datasetId, newPrice);
    }

    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = _nftContract;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
