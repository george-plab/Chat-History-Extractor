// Test script to verify LM Studio parser
import { parseLMStudio } from './parsers';
import fs from 'fs';

const testData = {
    "name": "Test Conversation",
    "createdAt": 1736789912980,
    "messages": [
        {
            "versions": [
                {
                    "type": "singleStep",
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Hello, this is a test message"
                        }
                    ]
                }
            ],
            "currentlySelected": 0
        },
        {
            "versions": [
                {
                    "type": "multiStep",
                    "role": "assistant",
                    "steps": [
                        {
                            "type": "contentBlock",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "This is the assistant's response"
                                }
                            ]
                        }
                    ]
                }
            ],
            "currentlySelected": 0
        }
    ]
};

try {
    const result = parseLMStudio(testData);
    console.log('✅ Parser test passed!');
    console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
    console.error('❌ Parser test failed:', error);
}
