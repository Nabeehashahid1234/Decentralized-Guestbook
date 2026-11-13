// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DecentralizedGuestbook
 * @dev A simple on-chain guestbook. Anyone can publish a message
 *      and anyone can read the messages stored on Sepolia.
 */
contract DecentralizedGuestbook {
    struct Note {
        address author;
        string message;
        uint256 timestamp;
    }

    Note[] private notes;

    // WRITE 1: Store a new message permanently on the blockchain.
    function postNote(string calldata _message) external {
        require(bytes(_message).length > 0, "Message cannot be empty");
        require(bytes(_message).length <= 280, "Message is too long");

        notes.push(Note({
            author: msg.sender,
            message: _message,
            timestamp: block.timestamp
        }));
    }

    // READ 1: Return the total number of messages.
    function getNoteCount() external view returns (uint256) {
        return notes.length;
    }

    // READ 2: Return one message by its zero-based index.
    function getNote(uint256 _index)
        external
        view
        returns (address author, string memory message, uint256 timestamp)
    {
        require(_index < notes.length, "Note does not exist");
        Note storage note = notes[_index];
        return (note.author, note.message, note.timestamp);
    }

    // READ 3: Count how many messages were posted by the connected wallet.
    function getMyNoteCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < notes.length; i++) {
            if (notes[i].author == msg.sender) {
                count++;
            }
        }
    }
}