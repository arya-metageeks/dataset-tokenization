// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract InferenceRegistry is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Enum to represent different model types
    enum ModelType { IMAGE, AUDIO, OTHER }

    // Struct to store inference information
    struct InferenceInfo {
        uint256 id;
        ModelType modelType;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from inference ID to InferenceInfo
    mapping(uint256 => InferenceInfo) private inferenceRecords;
    
    // Counter to track total number of inferences submitted
    uint256 private _totalInferences;

    // Event emitted when new inference is added
    event InferenceAdded(uint256 indexed inferenceId, ModelType modelType, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        _totalInferences = 0;
    }

    /**
     * @dev Adds a new inference record with manual ID
     * @param inferenceId Manual ID for the inference record
     * @param modelType Type of the model (0: IMAGE, 1: AUDIO, 2: OTHER)
     */
    function addInference(uint256 inferenceId, ModelType modelType) public {
        require(!inferenceRecords[inferenceId].exists, "Inference ID already exists");
        
        inferenceRecords[inferenceId] = InferenceInfo({
            id: inferenceId,
            modelType: modelType,
            timestamp: block.timestamp,
            exists: true
        });

        _totalInferences++;
        
        emit InferenceAdded(inferenceId, modelType, block.timestamp);
    }

    /**
     * @dev Retrieves inference information by ID
     * @param inferenceId The inference ID to query
     * @return id The ID of the inference
     * @return modelType The type of the model
     * @return timestamp The timestamp when the entry was made
     */
    function getInference(uint256 inferenceId) public view returns (
        uint256 id,
        ModelType modelType,
        uint256 timestamp
    ) {
        require(inferenceRecords[inferenceId].exists, "Inference record does not exist");
        
        InferenceInfo memory info = inferenceRecords[inferenceId];
        return (info.id, info.modelType, info.timestamp);
    }

    /**
     * @dev Returns the total number of inferences submitted
     */
    function getTotalInferences() public view returns (uint256) {
        return _totalInferences;
    }

    /**
     * @dev Required override for UUPS upgradeable contracts
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
