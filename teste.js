const fs = require('fs');

const getKeyValueMap = (fileName) => {
    const data = fs.readFileSync(fileName, 'utf8');
    const jsonData = JSON.parse(data);

    if (!jsonData.result || !jsonData.result.Blocks) {
        return;
    }

    const blocks = jsonData.result.Blocks;

    let keyMap = {};
    let valueMap = {};
    let blockMap = {};

    blocks.forEach(block => {
        const blockId = block.Id;
        blockMap[blockId] = block;
        if (block.BlockType === "KEY_VALUE_SET") {
            if (block.EntityTypes.includes("KEY")) {
                keyMap[blockId] = block;
            } else {
                valueMap[blockId] = block;
            }
        }
    });

    return { keyMap, valueMap, blockMap };
};

const getKeyValueRelationship = (keyMap, valueMap, blockMap) => {
    let kvs = {};

    Object.keys(keyMap).forEach(blockId => {
        const keyBlock = keyMap[blockId];
        const valueBlock = findValueBlock(keyBlock, valueMap);
        const key = getText(keyBlock, blockMap);
        const value = getText(valueBlock, blockMap);
        kvs[key] = value;
    });

    return kvs;
};

const findValueBlock = (keyBlock, valueMap) => {
    let valueBlock = null;

    keyBlock.Relationships.forEach(relationship => {
        if (relationship.Type === 'VALUE') {
            relationship.Ids.forEach(valueId => {
                valueBlock = valueMap[valueId];
            });
        }
    });

    return valueBlock;
};

const getText = (result, blockMap) => {
    let text = '';

    if (result.Relationships) {
        result.Relationships.forEach(relationship => {
            if (relationship.Type === 'CHILD') {
                relationship.Ids.forEach(childId => {
                    const word = blockMap[childId];
                    if (word.BlockType === 'WORD') {
                        text += word.Text + ' ';
                    }
                    if (word.BlockType === 'SELECTION_ELEMENT' && word.SelectionStatus === 'SELECTED') {
                        text += 'X ';
                    }
                });
            }
        });
    }

    return text.trim();
};

const getKeyValuesAsString = (kvs) => {
    let kvString = '';
    Object.keys(kvs).forEach(key => {
        kvString += `${key}: ${kvs[key]}\n`;
    });
    return kvString.trim();
};

const main = (fileName) => {
    const { keyMap, valueMap, blockMap } = getKeyValueMap(fileName);

    if (!keyMap || !valueMap || !blockMap) {
        return;
    }

    const kvs = getKeyValueRelationship(keyMap, valueMap, blockMap);
    const resultString = getKeyValuesAsString(kvs);
    console.log(resultString);

    return resultString;
};

const fileName = 'ocr_read.json';
main(fileName);
