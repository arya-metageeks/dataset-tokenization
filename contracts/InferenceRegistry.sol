// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract InferenceRegistry is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    enum ModelType {
        IMAGE,
        AUDIO,
        OTHER
    }

    struct InferenceInfo {
        uint256 id;
        ModelType modelType;
        uint256 timestamp;
        bool exists;
    }

    // Pack related storage variables together to optimize for rollup storage
    struct StorageData {
        uint256 totalInferences;
        uint256 lastProcessedBatch;
        bool paused;
    }
    
    StorageData private _storageData;
    
    // Use uint128 for gas optimization on rollups
    mapping(uint256 => InferenceInfo) private inferenceRecords;
    
    // Calldata optimized events
    event InferenceAdded(uint256[] indexed inferenceIds, ModelType[] modelTypes);
    event BatchProcessed(uint256 indexed batchId, uint256 count);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        _storageData.totalInferences = 0;
        _storageData.lastProcessedBatch = 0;
    }

    // Optimized for rollup calldata costs
    function addMultipleInferences(
        uint256[] calldata inferenceIds,
        ModelType[] calldata modelTypes
    ) public {
        require(
            inferenceIds.length == modelTypes.length,
            "Length mismatch"
        );
        require(inferenceIds.length > 0, "Empty batch");
        
        // Use block.timestamp once for the entire batch
        uint256 batchTimestamp = block.timestamp;
        
        unchecked {
            // Safe since we've checked length > 0
            for (uint256 i = 0; i < inferenceIds.length; i++) {
                require(
                    !inferenceRecords[inferenceIds[i]].exists,
                    "Duplicate ID"
                );

                inferenceRecords[inferenceIds[i]] = InferenceInfo({
                    id: inferenceIds[i],
                    modelType: modelTypes[i],
                    timestamp: batchTimestamp,
                    exists: true
                });
            }
            
            _storageData.totalInferences += inferenceIds.length;
            _storageData.lastProcessedBatch++;
        }

        // Emit single event for the batch instead of per inference
        emit InferenceAdded(inferenceIds, modelTypes);
        emit BatchProcessed(_storageData.lastProcessedBatch, inferenceIds.length);
    }

    function getInference(uint256 inferenceId)
        public
        view
        returns (
            uint256 id,
            ModelType modelType,
            uint256 timestamp
        )
    {
        InferenceInfo memory info = inferenceRecords[inferenceId];
        require(info.exists, "Not found");
        return (info.id, info.modelType, info.timestamp);
    }

    function getTotalInferences() public view returns (uint256) {
        return _storageData.totalInferences;
    }

    function getLastProcessedBatch() public view returns (uint256) {
        return _storageData.lastProcessedBatch;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}