import { contextBridge, ipcRenderer } from 'electron';
const api = {
    notes: {
        list: (folder) => ipcRenderer.invoke('notes:list', folder),
        get: (id) => ipcRenderer.invoke('notes:get', id),
        create: (data) => ipcRenderer.invoke('notes:create', data),
        update: (id, data) => ipcRenderer.invoke('notes:update', id, data),
        delete: (id) => ipcRenderer.invoke('notes:delete', id),
        search: (query) => ipcRenderer.invoke('notes:search', query),
    },
    folders: {
        list: () => ipcRenderer.invoke('folders:list'),
    },
    onMenuAction: (callback) => {
        ipcRenderer.on('menu:new-note', () => callback('new-note'));
    },
};
contextBridge.exposeInMainWorld('secNoteApi', api);
