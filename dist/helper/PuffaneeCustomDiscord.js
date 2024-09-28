import { EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

export class PuffaneeCustomDiscord {
  constructor(bot_client) {
    this.client = bot_client;
  }

  /**
   * Send direct message to Discord user
   *
   * @param {string} discordid User Discord ID
   * @param {*} data
   * @returns
   */
  async sendDm(discordid, data) {
    try {
      await this.client.users.send(discordid, data);
    } catch (error) {
      if (error.code === 50007) {
        // 50007 is dm closed error code in 06.07.2024 (mm.dd.yy)
        //console.log(
        //  `sendDm, Error sending dm message, User DM is not accessible 'discord:${discordid}'`
        //);
        return false;
      } else {
        console.error(
          `sendDm, Error sending dm message, 'discord:${discordid}' Error:`,
          error
        );
        return false;
      }
    }
  }

  /**
   * Convert Discord id to Discord identify and tag string
   *
   * @param {string} discordid User Discord ID
   * @returns
   */
  formatDID(discordid) {
    return `<@${discordid}> (${discordid})`;
  }

  /**
   * Convert Discord channel id to Discord channel id and tag string
   *
   * @param {string} channelid Channel ID
   * @returns
   */
  formatCHID(channelid) {
    return `<#${channelid}> (${channelid})`;
  }

  /**
   * Add role to user and if role is not created create the role
   *
   * @param {string} userid User Discord ID
   * @param {string} rolename Role name
   * @param {string} rolecolor Role color
   * @param {string} guildid Role guild id
   * @returns
   */
  async UserAddCustomRole(userid, rolename, rolecolor, guildid) {
    const guild = await this.client.guilds.cache.get(guildid);
    const roleName = rolename;

    let role = guild.roles.cache.find((role) => role.name === roleName);

    if (!role) {
      await guild.roles
        .create({
          name: roleName,
          color: rolecolor,
          permissions: [],
        })
        .then((newRole) => {
          const member = guild.members.cache.get(userid);
          if (member) {
            member.roles.add(newRole);
            return true;
          } else {
            console.error(
              "UserAddCustomRole(), Error: User not found: ",
              userid
            );
            return false;
          }
        })
        .catch(console.error);
    } else {
      const member = guild.members.cache.get(userid);
      if (member) {
        if (member.roles.cache.has(role.id)) {
          member.roles
            .remove(role)
            .then(() => {
              return false;
            })
            .catch(console.error);
        } else {
          member.roles.add(role);
          return true;
        }
      } else {
        console.error("addCustomRole(), Error: User not found: ", userid);
        return false;
      }
    }
  }

  /**
   * Add role to Discord user
   *
   * @param {string} userId
   * @param {string} guildId
   * @param {string} roleId
   * @returns
   */
  async UserAddRole(userId, guildId, roleId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);

      if (!guild) {
        return false;
      }

      const member = await guild.members.fetch(userId);

      if (!member) {
        return false;
      }

      const role = guild.roles.cache.get(roleId);

      if (!role) {
        return false;
      }

      await member.roles.add(role);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove role from Discord user
   *
   * @param {string} userId
   * @param {string} guildId
   * @param {string} roleId
   * @returns
   */
  async UserRemoveRole(userId, guildId, roleId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);

      if (!guild) {
        return false;
      }

      const member = await guild.members.fetch(userId);

      if (!member) {
        return false;
      }

      const role = guild.roles.cache.get(roleId);

      if (!role) {
        return false;
      }

      await member.roles.remove(role);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Discord user has this role
   *
   * @param {string} userId
   * @param {string} guildId
   * @param {string} roleId
   * @returns
   */
  async UserHasRole(userId, guildId, roleId) {
    const guild = await this.client.guilds.cache.get(guildId);

    if (!guild) {
      return false;
    }

    const member = await guild.members.cache.get(userId);

    if (!member) {
      return false;
    }

    const role = await guild.roles.cache.get(roleId);

    if (!role) {
      return false;
    }

    return await member.roles.cache.has(roleId);
  }

  /**
   * Get user avatar url
   *
   * @param {StringSelectMenuBuilder} userId
   * @returns
   */
  async UserAvatar(userId) {
    const user = await this.client.users.fetch(userId);
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });
    return avatarUrl;
  }

  /**
   * Create channel in parent category and send message
   *
   * @param {string} categoryId Parent category id
   * @param {string} channelName Channel name
   * @param {string} messageContent Send to new channel
   * @returns {Promise<void>}
   */
  async createChannelAndSendMessage(categoryId, channelName, messageContent) {
    try {
      const category = await this.client.channels.fetch(categoryId);

      if (!category || category.type !== 4) {
        console.error("Category is not valid!");
        return;
      }

      const newChannel = await category.guild.channels.create({
        name: channelName,
        type: 0,
        parent: categoryId,
      });

      await newChannel.send(messageContent);
      return newChannel.id;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Send message to channel
   *
   * @param {string} channel_id Channel id
   * @param {string} messageContent Send to new channel
   * @returns
   */
  async channelSendMessage(channel_id, messageContent) {
    try {
      const ch = await this.client.channels.fetch(channel_id);

      if (!ch) {
        return false;
      }

      return await ch.send(messageContent);
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Delete Discord channel
   *
   * @param {string} channel_id
   * @returns
   */
  async DeleteChannel(channel_id) {
    const ch = await this.client.channels.fetch(channel_id);

    if (!ch) {
      return false;
    }

    return await ch.delete();
  }

  /**
   * Change Discord channel name
   *
   * @param {string} channel_id
   * @param {string} newName
   * @returns
   */
  async setChannelname(channel_id, newName) {
    const ch = await this.client.channels.fetch(channel_id);

    if (!ch) {
      return false;
    }

    return await ch.setName(`${newName}`);
  }

  /**
   * Move an Discord channel to new category
   *
   * @param {string} channel_id
   * @param {string} newCategory_id
   * @returns
   */
  async moveChannelCategory(channel_id, newCategory_id) {
    const ch = await this.client.channels.fetch(channel_id);
    const ctg = await this.client.channels.fetch(newCategory_id);

    if (!ch || !ctg) {
      return false;
    }

    await ch.setParent(newCategory_id);

    return true;
  }

  /**
   * Check if a Discord channel belongs to a specific category.
   *
   * @param {string} channel_id The ID of the channel to check.
   * @param {string} category_id The ID of the category to check against.
   * @returns {boolean} True if the channel belongs to the category, false otherwise.
   */
  async isChannelInCategory(channel_id, category_id) {
    try {
      const channel = await this.client.channels.fetch(channel_id);

      return channel.parentId === category_id;
    } catch (error) {
      console.error("Error checking channel category:", error);
      return false;
    }
  }
}
