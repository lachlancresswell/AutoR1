import * as fs from 'fs';

const PROJECT_NO_INIT_START = './src/__tests__/Projects/test_no_init.dbpr';
const PROJECT_INIT_START = './src/__tests__/Projects/test_init.dbpr';
const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const TEMPLATES_START = './src/__tests__/Projects/templates.r2t';
const PROJECT_SUB_ARRAY_START = './src/__tests__/Projects/sub_array.dbpr';
export const PROJECT_NO_EXIST = '/non/existent/path'
export const PROJECT_NO_INIT = PROJECT_NO_INIT_START + '.test'
export const PROJECT_INIT = PROJECT_INIT_START + '.test'
export const PROJECT_INIT_AP = PROJECT_INIT_AP_START + '.test'
export const PROJECT_SUB_ARRAY = PROJECT_SUB_ARRAY_START + '.test';
export const TEMPLATES = TEMPLATES_START + '.test'

// Create a new project file for each test
export const setupTest = () => {
    const fileId = Math.round(Math.random() * 10000);

    fs.copyFileSync(PROJECT_NO_INIT_START, PROJECT_NO_INIT + fileId);
    fs.copyFileSync(PROJECT_INIT_START, PROJECT_INIT + fileId);
    fs.copyFileSync(PROJECT_INIT_AP_START, PROJECT_INIT_AP + fileId);
    fs.copyFileSync(PROJECT_SUB_ARRAY_START, PROJECT_SUB_ARRAY + fileId);
    fs.copyFileSync(TEMPLATES_START, TEMPLATES + fileId);

    return fileId;
};

export const cleanupTest = (fileId: number) => {
    fs.unlinkSync(PROJECT_NO_INIT + fileId);
    fs.unlinkSync(PROJECT_INIT + fileId);
    fs.unlinkSync(PROJECT_INIT_AP + fileId);
    fs.unlinkSync(PROJECT_SUB_ARRAY + fileId);
    fs.unlinkSync(TEMPLATES + fileId);
}