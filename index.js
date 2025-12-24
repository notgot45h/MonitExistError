const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

class PluginManager {
    constructor(client) {
        this.client = client;
        this.pluginsDir = path.join(__dirname, 'plugins');
        this.activePlugins = new Map();
        this.pluginCommands = new Collection();
        this.pluginConfigs = new Map();
        this.pluginConfigFile = path.join(this.pluginsDir, 'plugins-config.json');
        
        this.initializePluginsDirectory();
        this.loadPluginConfigs();
    }

    initializePluginsDirectory() {
        try {
            if (!fs.existsSync(this.pluginsDir)) {
                fs.mkdirSync(this.pluginsDir, { recursive: true });
                console.log('Created plugins directory');
            }
            
            const defaultConfig = { plugins: {} };
            if (!fs.existsSync(this.pluginConfigFile)) {
                fs.writeFileSync(this.pluginConfigFile, JSON.stringify(defaultConfig, null, 2));
            }
        } catch (error) {
            console.error('Failed to initialize plugins directory:', error.message);
        }
    }

    loadPluginConfigs() {
        try {
            if (fs.existsSync(this.pluginConfigFile)) {
                const configData = JSON.parse(fs.readFileSync(this.pluginConfigFile, 'utf8'));
                this.pluginConfigs = new Map(Object.entries(configData.plugins || {}));
            }
        } catch (error) {
            console.error('Failed to load plugin configs:', error.message);
            this.pluginConfigs = new Map();
        }
    }

    savePluginConfigs() {
        try {
            const config = {
                plugins: Object.fromEntries(this.pluginConfigs),
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.pluginConfigFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Failed to save plugin configs:', error.message);
        }
    }

    scanPlugins() {
        try {
            if (!fs.existsSync(this.pluginsDir)) return [];
            
            const pluginFolders = fs.readdirSync(this.pluginsDir).filter(folder => {
                const pluginPath = path.join(this.pluginsDir, folder);
                return fs.statSync(pluginPath).isDirectory();
            });
            
            return pluginFolders;
        } catch (error) {
            console.error('Failed to scan plugins:', error.message);
            return [];
        }
    }

    getPluginInfo(pluginName) {
        const pluginPath = path.join(this.pluginsDir, pluginName);
        const packageFile = path.join(pluginPath, 'package.json');
        const pluginFile = path.join(pluginPath, 'index.js');
        
        if (!fs.existsSync(pluginFile)) return null;
        
        try {
            let pluginInfo = {
                name: pluginName,
                path: pluginPath,
                main: pluginFile,
                enabled: false,
                loaded: false
            };
            
            if (fs.existsSync(packageFile)) {
                const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
                pluginInfo = { ...pluginInfo, ...packageData };
            }
            
            if (this.pluginConfigs.has(pluginName)) {
                const config = this.pluginConfigs.get(pluginName);
                pluginInfo.enabled = config.enabled || false;
                pluginInfo.config = config.config || {};
            }
            
            return pluginInfo;
        } catch (error) {
            console.error(`Failed to get plugin info for ${pluginName}:`, error.message);
            return null;
        }
    }

    async loadPlugin(pluginName) {
        try {
            const pluginInfo = this.getPluginInfo(pluginName);
            if (!pluginInfo) {
                console.log(`Plugin ${pluginName} not found or invalid`);
                return false;
            }
            
            if (!pluginInfo.enabled) {
                console.log(`Plugin ${pluginName} is disabled`);
                return false;
            }
            
            if (this.activePlugins.has(pluginName)) {
                console.log(`Plugin ${pluginName} is already loaded`);
                return true;
            }
            
            const pluginModule = require(pluginInfo.main);
            
            const pluginInstance = {
                name: pluginName,
                info: pluginInfo,
                module: pluginModule,
                instance: null
            };
            
            if (typeof pluginModule.initialize === 'function') {
                pluginInstance.instance = await pluginModule.initialize({
                    client: this.client,
                    pluginManager: this,
                    pluginConfig: pluginInfo.config || {}
                });
            }
            
            this.activePlugins.set(pluginName, pluginInstance);
            
            if (pluginModule.commands && Array.isArray(pluginModule.commands)) {
                pluginModule.commands.forEach(command => {
                    if (command.name && command.execute) {
                        this.pluginCommands.set(command.name, command);
                        console.log(`Loaded command: ${command.name} from plugin ${pluginName}`);
                    }
                });
            }
            
            console.log(`Plugin ${pluginName} loaded successfully`);
            return true;
            
        } catch (error) {
            console.error(`Failed to load plugin ${pluginName}:`, error.message);
            console.error(error.stack);
            return false;
        }
    }

    async unloadPlugin(pluginName) {
        try {
            const plugin = this.activePlugins.get(pluginName);
            if (!plugin) {
                console.log(`Plugin ${pluginName} is not loaded`);
                return true;
            }
            
            if (typeof plugin.module.shutdown === 'function') {
                await plugin.module.shutdown({
                    client: this.client,
                    pluginManager: this,
                    instance: plugin.instance
                });
            }
            
            const pluginCommands = this.pluginCommands.filter(cmd => 
                plugin.module.commands?.some(c => c.name === cmd.name)
            );
            
            pluginCommands.forEach(cmd => {
                this.pluginCommands.delete(cmd.name);
            });
            
            delete require.cache[require.resolve(plugin.info.main)];
            
            this.activePlugins.delete(pluginName);
            
            console.log(`Plugin ${pluginName} unloaded successfully`);
            return true;
            
        } catch (error) {
            console.error(`Failed to unload plugin ${pluginName}:`, error.message);
            return false;
        }
    }

    async reloadPlugin(pluginName) {
        await this.unloadPlugin(pluginName);
        return await this.loadPlugin(pluginName);
    }

    enablePlugin(pluginName) {
        const pluginInfo = this.getPluginInfo(pluginName);
        if (!pluginInfo) return false;
        
        this.pluginConfigs.set(pluginName, {
            enabled: true,
            config: pluginInfo.config || {}
        });
        
        this.savePluginConfigs();
        console.log(`Plugin ${pluginName} enabled`);
        return true;
    }

    disablePlugin(pluginName) {
        const pluginInfo = this.getPluginInfo(pluginName);
        if (!pluginInfo) return false;
        
        this.pluginConfigs.set(pluginName, {
            enabled: false,
            config: pluginInfo.config || {}
        });
        
        this.savePluginConfigs();
        console.log(`Plugin ${pluginName} disabled`);
        return true;
    }

    getPluginConfig(pluginName) {
        const config = this.pluginConfigs.get(pluginName);
        return config ? config.config || {} : {};
    }

    updatePluginConfig(pluginName, newConfig) {
        const currentConfig = this.pluginConfigs.get(pluginName) || {};
        this.pluginConfigs.set(pluginName, {
            ...currentConfig,
            config: { ...currentConfig.config, ...newConfig }
        });
        
        this.savePluginConfigs();
        
        const plugin = this.activePlugins.get(pluginName);
        if (plugin && typeof plugin.module.onConfigUpdate === 'function') {
            plugin.module.onConfigUpdate({
                client: this.client,
                pluginManager: this,
                instance: plugin.instance,
                newConfig: this.getPluginConfig(pluginName)
            });
        }
    }

    async loadAllPlugins() {
        const pluginFolders = this.scanPlugins();
        let loadedCount = 0;
        
        for (const pluginName of pluginFolders) {
            const loaded = await this.loadPlugin(pluginName);
            if (loaded) loadedCount++;
        }
        
        console.log(`Loaded ${loadedCount} of ${pluginFolders.length} plugins`);
        return loadedCount;
    }

    getPluginList() {
        const pluginFolders = this.scanPlugins();
        const plugins = [];
        
        for (const pluginName of pluginFolders) {
            const info = this.getPluginInfo(pluginName);
            if (info) {
                plugins.push({
                    name: info.name,
                    enabled: info.enabled,
                    loaded: this.activePlugins.has(pluginName),
                    description: info.description || 'No description',
                    version: info.version || '1.0.0',
                    author: info.author || 'Unknown'
                });
            }
        }
        
        return plugins;
    }

    getActivePlugins() {
        return Array.from(this.activePlugins.values()).map(p => p.name);
    }

    hasPlugin(pluginName) {
        return this.activePlugins.has(pluginName);
    }

    getPlugin(pluginName) {
        return this.activePlugins.get(pluginName);
    }

    getPluginCommands() {
        return this.pluginCommands;
    }
}

const log = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Бот: ${message}`);
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const pluginManager = new PluginManager(client);

client.commands = new Collection();
client.pluginManager = pluginManager;

client.once(Events.ClientReady, async c => {
    log(`Готов! Бот ${c.user.tag} в сети.`);
    
    log('Загрузка плагинов...');
    const loadedCount = await pluginManager.loadAllPlugins();
    log(`Загружено ${loadedCount} плагинов`);

    const pluginCommands = pluginManager.getPluginCommands();
    pluginCommands.forEach((command, name) => {
        client.commands.set(name, command);
        log(`Зарегистрирована команда плагина: ${name}`);
    });
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Команда ${interaction.commandName} не найдена.`);
        return;
    }

    try {
        await command.execute(interaction);
        log(`Выполнена команда: ${interaction.commandName}`);
    } catch (error) {
        log(`Ошибка в команде ${interaction.commandName}: ${error.message}`);
        try {
            await interaction.reply({ content: 'Произошла ошибка при выполнении команды!', ephemeral: true });
        } catch (e) {
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', async () => {
    log('Выключение бота...');
    
    const activePlugins = pluginManager.getActivePlugins();
    for (const pluginName of activePlugins) {
        await pluginManager.unloadPlugin(pluginName);
    }
    
    client.destroy();
    process.exit(0);
});