import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Client, GatewayIntentBits, Guild, Message, PermissionResolvable, PermissionsBitField, Role } from 'discord.js';
import * as tinycolor from 'tinycolor2';
import { retry } from './aofg.helpers';

const DEFAULT_ROLE_PERMISSION: PermissionResolvable = [
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.SendMessagesInThreads,
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.AddReactions,
  PermissionsBitField.Flags.ChangeNickname,
  PermissionsBitField.Flags.CreateInstantInvite,
  PermissionsBitField.Flags.CreatePublicThreads,
  PermissionsBitField.Flags.Speak,
];

// :crown: :hammer_pick: :crossed_swords:
const ROLES = [
  {
    title: 'Crafter',
    emodji: '⚒️',
    color: new tinycolor('#70ff00'),
  },
  {
    title: 'Land Lord',
    emodji: '👑',
    color: new tinycolor('#ff9900'),
  },
  {
    title: 'Adventurer',
    emodji: '⚔️',
    color: new tinycolor('#0082ff'),
  },
] as const;

const LEVELS = [
    'Legendary',
    'Master', 
    'Expert', 
    'Novice', 
] as const;

@Injectable()
export class AofgBot implements OnApplicationBootstrap {
  private client: Client<boolean>;
  guild: Guild;
  roles: Partial<Record<typeof ROLES[number]['title'], Partial<Record<typeof LEVELS[number], Role>>>> = {}

  get allRoles() {
    return Object.values(this.roles).map(dict => Object.values(dict)).flat()
  }

  public getUserRole(roles: string[]) {
    return this.allRoles.find(role => roles.includes(role.id))
  }

  public getUserTitle(roles: string[]) {
    const role = this.getUserRole(roles);
    
    return role ? role.name : "Untitled"
  }

  async onApplicationBootstrap() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    });

    this.setupHandlers();

    await this.client.login(process.env.DISCORD_BOT_TOKEN);

    await this.setupClient()
  }

  async setupClient() {
    await this.client.guilds.fetch()
    this.guild = this.client.guilds.cache.get(process.env.DISCORD_GUILD);
    if (typeof this.guild === 'undefined') {
      throw new Error('Looks like bot not added to proper channel');
    }

    return this.setupRoles()
  }

  async setupRoles() {
    await this.guild.roles.fetch();

    // DO NOT DELETE ON START
    // const tasks = ROLES.map((role) =>
    //   this.guild.roles.cache
    //     .filter((r) => r.name.includes(role.title))
    //     .map((r) => {
    //       console.log(`Deleting ${r.name}`);
    //       return this.guild.roles.delete(r);
    //     }),
    // ).flat();
    // await Promise.all(tasks);

    for (let level = 0; level < LEVELS.length; level++) {
      for (let roleIndex = 0; roleIndex < ROLES.length; roleIndex++) {
        const role = ROLES[roleIndex];
        const title = `${LEVELS[level]} ${role.title}`;

        let found = this.guild.roles.cache.find((r) => r.name === title);

        if (!found) {
          console.log(`Role ${title} not found -> create`);
          found = await retry(() =>
            this.guild.roles.create({
              name: title,
              color: role.color.desaturate(10 * level).toHex() as any,
              hoist: true,
              permissions: DEFAULT_ROLE_PERMISSION,
              mentionable: false,
              unicodeEmoji: level < LEVELS.length / 2 ? role.emodji : undefined,
            }),
          );
        } else if (!found.permissions.equals(DEFAULT_ROLE_PERMISSION)) {
            console.log(`change permision for ${found.name}`)
            await found.setPermissions(DEFAULT_ROLE_PERMISSION)
        }

        this.roles[role.title] = this.roles[role.title] || {}
        this.roles[role.title][LEVELS[level]] = found;
      }
    }

    for (let roleIndex = 0; roleIndex < ROLES.length; roleIndex++) {
      const role = ROLES[roleIndex];
      const found = this.guild.roles.cache.find((r) => r.name === role.title);

      if (!found) {
        console.log(`Role ${role.title} not found -> create`);
        await retry(() =>
          this.guild.roles.create({
            name: role.title,
            color: role.color.toHex() as any,
            hoist: false,
            permissions: DEFAULT_ROLE_PERMISSION,
            mentionable: true,
          }),
        );
      }
    }
  }

  async onReady(client: Client<boolean>) {
    console.log('imready');
  }

  async onMessageCreate(message: Message) {
    console.log(this.client.guilds.cache.find((g) => g.id === process.env.DISCORD_GUILD));
    console.log('onmessage', message);
    if (message.content.startsWith('ping')) await message.channel.send('pong!');
  }

  setupHandlers() {
    this.client.once('messageCreate', this.setupRoles.bind(this));
    this.client.on('ready', this.onReady.bind(this));
    this.client.on('messageCreate', this.onMessageCreate.bind(this));
  }
}
