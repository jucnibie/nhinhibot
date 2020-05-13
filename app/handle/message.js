module.exports = function ({
	api,
	modules,
	config,
	__GLOBAL,
	User,
	Thread,
	Rank,
	economy
}) {
	/* ================ Config ==================== */
	let { prefix, googleSearch, wolfarm, osuAPI, yandex, openweather, tenor, admins, steamAPI, ENDPOINT } = config;
	const fs = require("fs");
	const moment = require("moment-timezone");
	const request = require("request");
	const randomfacts = require("@dpmcmlxxvi/randomfacts");
	const ms = require("parse-ms");

	/* ================ CronJob ==================== */

	if (!fs.existsSync(__dirname + "/src/listCommands.json")) {
		var template = [];
		push = JSON.stringify(template);
		fs.writeFile(__dirname + "/src/listCommand.json", push, "utf-8", err => {
			if (err) throw err;
			modules.log("Tạo file listCommand mới thành công!");
		});
	}

	if (!fs.existsSync(__dirname + "/src/groupID.json")) {
		var template = [];
		push = JSON.stringify(template);
		fs.writeFile(__dirname + "/src/listCommand.json", push, "utf-8", err => {
			if (err) throw err;
			modules.log("Tạo file groupID mới thành công!");
		});
	}

	if (!fs.existsSync(__dirname + "/src/quotes.json")) {
		request("https://type.fit/api/quotes", (err, response, body) => {
			if (err) throw err;
			var bodyReplace = body.replace("\n", "");
			fs.writeFile(__dirname + "/src/quotes.json", bodyReplace, "utf-8", (err) => {
				if (err) throw err;
				modules.log("Tạo file quotes mới thành công!");
			});
		});
	}

	fs.readFile(__dirname + "/src/groupID.json", "utf-8", (err, data) => {
		if (err) throw err;
		var groupids = JSON.parse(data);
		if (!fs.existsSync(__dirname + "/src/listThread.json")) {
			var firstJSON = {
				wake: [],
				sleep: [],
				fact: []
			};
			var newData = JSON.stringify(firstJSON);
			fs.writeFile(__dirname + "/src/listThread.json", newData, "utf-8", (err) => {
				if (err) throw err;
				modules.log("Tạo file listThread mới thành công!");
			});
		}
		setInterval(() => {
			fs.readFile(__dirname + "/src/listThread.json", "utf-8", (err, data) => {
				if (err) throw err;
				var oldData = JSON.parse(data);
				var timer = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm");
				groupids.forEach(item => {
					while (timer == "23:00" && !oldData.sleep.includes(item)) {
						api.sendMessage(`Tới giờ ngủ rồi đấy nii-chan, おやすみなさい!`, item);
						oldData.sleep.push(item);
						break;
					}

					//chào buổi sáng
					while (timer == "07:00" && !oldData.wake.includes(item)) {
						api.sendMessage(`おはようございま các nii-chan uwu`, item);
						oldData.wake.push(item);
						break;
					}

					//những sự thật mỗi ngày
					while (timer == "08:00" && !oldData.fact.includes(item)) {
						oldData.fact.push(item);
						request("https://random-word-api.herokuapp.com/word?number=1", (err, response, body) => {
							if (err) throw err;
							var retrieve = JSON.parse(body);
							const fact = randomfacts.make(retrieve);
							api.sendMessage('📖 Fact của ngày hôm nay:\n "' + fact + '".', item);
						});
						break;
					}

					//xoá toàn bộ
					if (timer == "00:00") {
						oldData.wake = [];
						oldData.sleep = [];
						oldData.fact = [];
					}

					let newData = JSON.stringify(oldData);
					fs.writeFile(__dirname + "/src/listThread.json", newData, "utf-8", (err) => {
						if (err) throw err;
					});
				});
			});
		}, 1000);
	});
	return function ({ event }) {
		let { body: contentMessage, senderID, threadID, messageID } = event;
		senderID = parseInt(senderID);
		threadID = parseInt(threadID);
		messageID = messageID.toString();

		/* ================ Staff Commands ==================== */

		//lấy file cmds
		var nocmdFile = fs.readFileSync(__dirname + "/src/cmds.json");
		var nocmdData = JSON.parse(nocmdFile);

		//tạo 1 đối tượng mới nếu group chưa có trong file cmds
		if (!nocmdData.banned.some(item => item.id == threadID)) {
			let addThread = {
				id: threadID,
				cmds: []
			};
			nocmdData.banned.push(addThread);
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(nocmdData));
		}

		//lấy lệnh bị cấm trong group
		var cmds = nocmdData.banned.find(item => item.id == threadID).cmds;
		for (const item of cmds) {
			//Nếu bạn dùng lệnh kí tự đặc biệt, hãy thêm vào sau phần == 0 " || contentMessage.indexOf(item) == 0"
			if (contentMessage.indexOf(prefix + item) == 0) return api.sendMessage("Lệnh này đã bị cấm!", threadID);
		}

		//unban command
		if (contentMessage.indexOf(`${prefix}unban command`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 14, contentMessage.length);
			if (!content) return api.sendMessage("Hãy nhập lệnh cần bỏ cấm!", threadID);

			fs.readFile(__dirname + "/src/cmds.json", "utf-8", (err, data) => {
				var jsonData = JSON.parse(data);
				var getCMDS = jsonData.banned.find(item => item.id == threadID).cmds;
				if (!getCMDS.includes(content)) return api.sendMessage("Lệnh " + content + " chưa bị cấm", threadID);
				else {
					let getIndex = getCMDS.indexOf(content);
					getCMDS.splice(getIndex, 1);
					api.sendMessage("Đã bỏ cấm " + content + " trong group này", threadID);
					/*
					* Nếu bot có dùng lệnh kí tự đặc biệt, hãy thay thế dòng trên bằng 2 dòng dưới đây.
					* Sửa kí tự # thành kí tự đặc biệt mà bạn dùng trong lệnh của bot hoặc thêm vào bên cạnh.
					* VD thêm vào: (content == '#' || content == '*' || content == '^')...	
					if (content == '#') api.sendMessage("Đã bỏ cấm " + content + " trong group này", threadID, messageID);
					else api.sendMessage("Đã bỏ cấm " + cmd + " trong group này", threadID, messageID);
					*/
				}
				let newData = JSON.stringify(jsonData);
				fs.writeFileSync(__dirname + "/src/cmds.json", newData, "utf-8");
			});
			return;
		}

		//ban command
		if (contentMessage.indexOf(`${prefix}ban command`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 12, contentMessage.length);
			if (!content) return api.sendMessage("Hãy nhập lệnh cần cấm!", threadID);

			fs.readFile(__dirname + "/src/cmds.json", "utf-8", (err, data) => {
				var jsonData = JSON.parse(data);
				if (!jsonData.cmds.includes(content)) return api.sendMessage("Không có lệnh " + content + " trong cmds.json nên không thể cấm", threadID);
				else {
					if (jsonData.banned.some(item => item.id == threadID)) {
						let getThread = jsonData.banned.find(item => item.id == threadID);
						getThread.cmds.push(content);
					}
					else {
						let addThread = {
							id: threadID,
							cmds: []
						};
						addThread.cmds.push(content);
						jsonData.banned.push(addThread);
					}
					api.sendMessage("Đã cấm " + content + " trong group này", threadID);
				}
				let newData = JSON.stringify(jsonData);
				fs.writeFileSync(__dirname + "/src/cmds.json", newData, "utf-8");
			});
			return;
		}

		if (__GLOBAL.userBlocked.includes(senderID)) return;

		// Unban thread
		if (__GLOBAL.threadBlocked.includes(threadID)) {
			if (contentMessage == `${prefix}unban thread` && admins.includes(senderID)) {
				const indexOfThread = __GLOBAL.threadBlocked.indexOf(threadID);
				if (indexOfThread == -1) return api.sendMessage("Nhóm này chưa bị chặn!", threadID);
				Thread.unban(threadID).then(success => {
					if (!success) return api.sendMessage("Không thể bỏ chặn nhóm này!", threadID);
					api.sendMessage("Nhóm này đã được bỏ chặn!", threadID);
					__GLOBAL.threadBlocked.splice(indexOfThread, 1);
					modules.log(threadID, "Unban Thread");
				});
				return;
			}
			return;
		}

		Rank.updatePoint(senderID, 2);

		// Unban user
		if (contentMessage.indexOf(`${prefix}unban`) == 0 && admins.includes(senderID)) {
			const mentions = Object.keys(event.mentions);
			if (!mentions) return api.sendMessage("Vui lòng tag những người cần unban", threadID);
			mentions.forEach(mention => {
				const indexOfUser = __GLOBAL.userBlocked.indexOf(parseInt(mention));
				if (indexOfUser == -1)
					return api.sendMessage(
						{
							body: `${event.mentions[mention]} chưa bị ban, vui lòng ban trước!`,
							mentions: [
								{
									tag: event.mentions[mention],
									id: mention
								}
							]
						},
						threadID
					);

				User.unban(mention).then(success => {
					if (!success) return api.sendMessage("Không thể unban người này!", threadID);
					api.sendMessage(
						{
							body: `Đã unban ${event.mentions[mention]}!`,
							mentions: [
								{
									tag: event.mentions[mention],
									id: mention
								}
							]
						},
						threadID
					);
					__GLOBAL.userBlocked.splice(indexOfUser, 1);
					modules.log(mentions, "Unban User");
				});
			});
			return;
		}

		// Ban thread
		if (contentMessage == `${prefix}ban thread` && admins.includes(senderID)) {
			api.sendMessage("Bạn có chắc muốn ban group này ?", threadID, function (error, info) {
				if (error) return modules.log(error, 2);
				__GLOBAL.confirm.push({
					type: "ban:thread",
					messageID: info.messageID,
					target: parseInt(threadID),
					author: senderID
				});
			});
			return;
		}

		// Ban user
		if (contentMessage.indexOf(`${prefix}ban`) == 0 && admins.includes(senderID)) {
			const mentions = Object.keys(event.mentions);
			if (!mentions) return api.sendMessage("Vui lòng tag những người cần ban!", threadID);
			mentions.forEach(mention => {
				if (admins.includes(mention)) return api.sendMessage("Bạn không đủ thẩm quyền để ban người này", threadID);
				api.sendMessage(
					{
						body: `Bạn có chắc muốn ban ${event.mentions[mention]}?`,
						mentions: [
							{
								tag: event.mentions[mention],
								id: mention
							}
						]
					},
					threadID,
					function (error, info) {
						if (error) return modules.log(error, 2);
						__GLOBAL.confirm.push({
							type: "ban:user",
							messageID: info.messageID,
							target: {
								tag: event.mentions[mention],
								id: parseInt(mention)
							},
							author: senderID
						});
					}
				);
			});
			return;
		}

		//Thông báo tới toàn bộ group!
		if (contentMessage.indexOf(`${prefix}noti`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (!content) return api.sendMessage("Nhập thông tin vào!", threadID, messageID);

			api.getThreadList(100, null, ["INBOX"], function (err, list) {
				if (err) throw err;
				list.forEach(item => {
					if (item.isGroup == true && item.threadID != threadID) api.sendMessage(content, item.threadID);
					modules.log("gửi thông báo mới thành công!");
				});
			});
			return;
		}

		//giúp thành viên thông báo lỗi về admin
		if (contentMessage.indexOf(`${prefix}report`) == 0) {
			var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
			if (!content) return api.sendMessage("Có vẻ như bạn chưa nhập thông tin, vui lòng nhập thông tin lỗi mà bạn gặp!", threadID, messageID);
			let reportID = Math.floor(Math.random() * (1e4 + 1 - 1e5)) + 1e4;
			api.sendMessage(
				"Có báo cáo lỗi mới từ id: " +
				senderID +
				"\n- ID support " +
				reportID +
				"\n- ThreadID gặp lỗi: " +
				threadID +
				"\n- Lỗi gặp phải: " +
				content +
				"\n- Lỗi được thông báo vào lúc: " +
				moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss"),
				admins[0]
			);
			return api.sendMessage("Thông tin lỗi của bạn đã được gửi về admin!, đây là id hỗ trợ của bạn: " + reportID, threadID, messageID);
		}

		/* ==================== Help Commands ================*/

		//add thêm lệnh cho help
		if (contentMessage.indexOf(`${prefix}sethelp`) == 0 && admins.includes(senderID)) {
			var string = contentMessage.slice(prefix.length + 8, contentMessage.length); //name | decs | usage | example | group
			if (string.length == 0) return api.sendMessage("error: content Not Found!", threadID, messageID);

			let stringIndexOf = string.indexOf(" | ");
			let name = string.slice(0, stringIndexOf); //name
			let center = string.slice(stringIndexOf + 1, string.length); //decs | usage | example | group

			let stringIndexOf2 = center.indexOf(" | ");
			let decs = center.slice(0, stringIndexOf2); //decs
			let stringNext = center.slice(stringIndexOf2 + 1, center.length); //usage | example | group

			let stringIndexOf3 = stringNext.indexOf(" | ");
			let usage = stringNext.slice(0, stringIndexOf3); //usage
			let stringNext2 = stringNext.slice(stringIndexOf3 + 1, stringNext.length); //example | group

			let stringIndexOf4 = stringNext2.indexOf(" | ");
			let example = stringNext2.slice(0, stringIndexOf4); //example
			let group = stringNext2.slice(stringIndexOf4 + 1, stringNext2.length); //group

			fs.readFile(__dirname + "/src/listCommands.json", "utf-8", (err, data) => {
				if (err) throw err;
				var oldDataJSON = JSON.parse(data);
				var pushJSON = {
					name: name,
					decs: decs,
					usage: usage,
					example: example,
					group: group
				};
				oldDataJSON.push(pushJSON);
				let newData = JSON.stringify(oldDataJSON);
				fs.writeFile(__dirname + "/src/listCommands.json", newData, "utf-8", (err) => {
					if (err) throw err;
					api.sendMessage("Ghi lệnh mới hoàn tất!", threadID, messageID);
				});
			});
			return;
		}

		//delete lệnh trong help
		if (contentMessage.indexOf(`${prefix}delhelp`) == 0 && admins.includes(senderID)) {
			var string = contentMessage.slice(prefix.length + 8, contentMessage.length);
			fs.readFile(__dirname + "/src/listCommands.json", "utf-8", (err, data) => {
				if (err) throw err;
				var oldDataJSON = JSON.parse(data);
				const index = oldDataJSON.findIndex(x => x.name === string);
				if (index !== undefined) oldDataJSON.splice(index, 1);
				let newData = JSON.stringify(oldDataJSON);
				api.sendMessage(newData, threadID, messageID);
				fs.writeFile(__dirname + "/src/listCommands.json", newData, "utf-8", (err) => {
					if (err) throw err;
					api.sendMessage("Xóa lệnh hoàn tất!", threadID, messageID);
				});
			});
			return;
		}

		//export file json
		if (contentMessage == `${prefix}extracthelp` && admins.includes(senderID)) {
			fs.readFile(__dirname + "/src/listCommands.json", "utf-8", (err, data) => {
				if (err) throw err;
				api.sendMessage(data, threadID, messageID);
			});
			return;
		}

		if (contentMessage.indexOf(`${prefix}help`) == 0) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (content.length == 0)
				return api.sendMessage("Để biết tất cả các lệnh nhinhi, hãy sử dụng !help all", threadID, messageID);

			if (content == "all") {
				return fs.readFile(__dirname + "/src/listCommands.json", "utf-8", (err, data) => {
					if (err) throw err;
					var helpMe = JSON.parse(data);
					var helpList = [];
					var helpName = "";
					helpMe.forEach(item => {
						helpList.push(item.name);
					});
					helpName = helpList.join(', ');
					api.sendMessage("Đây là toàn bộ lệnh của nhinhi: " + helpName, threadID, messageID);
				});
			}

			fs.readFile(__dirname + "/src/listCommands.json", "utf-8", (err, data) => {
				if (err) return api.sendMessage("Đã xảy ra lỗi không mong muốn!", threadID, messageID);
				var helpMe = JSON.parse(data);
				if (helpMe.some(item => item.name == content)) {
					return api.sendMessage(
						'Thông tin lệnh bạn đang tìm:' + '\n' +
						'- Tên lệnh: ' + helpMe.find(item => item.name == content).name + '\n' +
						'- Thông tin: ' + helpMe.find(item => item.name == content).decs + '\n' +
						'- Sử dụng: ' + prefix + helpMe.find(item => item.name == content).usage + '\n' +
						'- Hướng dẫn: ' + prefix + helpMe.find(item => item.name == content).example + '\n' +
						'- Thuộc loại: ' + helpMe.find(item => item.name == content).group, threadID, messageID
					);
				}
				else {
					var helpList = [];
					var helpName = "";
					helpMe.forEach(item => {
						if (content !== item.name) helpList.push(item.name);
					});
					helpName = helpList.join(", ");
					return api.sendMessage("Lệnh bạn nhập không tồn tại, đây là danh sách lệnh của nhinhi:\n" + helpName, threadID, messageID);
				}
			});
		}

		//yêu cầu công việc cho bot
		if (contentMessage.indexOf(`${prefix}request`) == 0) {
			var content = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (!fs.existsSync(__dirname + "/src/requestList.json")) {
				let requestList = [];
				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(requestList));
			}

			if (content.indexOf("add") == 0) {
				var addnew = content.slice(4, content.length);
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				getData.push(addnew);

				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(getData));
				return api.sendMessage("Đã thêm '" + addnew + "' vào request list", threadID, () => {
					api.sendMessage("ID " + senderID + " Đã thêm '" + addnew + "' vào request list", admins[0]);
				}, messageID);
			}

			else if (content.indexOf("del") == 0 && admins.includes(senderID)) {
				var deletethisthing = content.slice(4, content.length);
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				if (getData.length == 0) return api.sendMessage("Không tìm thấy " + deletethisthing, threadID, messageID);
				var itemIndex = getData.indexOf(deletethisthing);
				getData.splice(itemIndex, 1);
				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(getData));
				return api.sendMessage("Đã xóa: " + deletethisthing, threadID, messageID);
			}

			else if (content.indexOf("list") == 0) {
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				if (getData.length == 0) return api.sendMessage("Không có việc cần làm", threadID, messageID);
				let allWorks = "";
				getData.map(item => {
					allWorks = allWorks + `\n- ` + item;
				});
				return api.sendMessage("Đây là toàn bộ yêu cầu mà các bạn đã gửi:" + allWorks, threadID, messageID);
			}
		}

		/* ==================== Genarate Commands ================*/

		//meme
		if (contentMessage == `${prefix}meme`)
			return request("https://meme-api.herokuapp.com/gimme/memes", (err, response, body) => {
				if (err) throw err;
				var content = JSON.parse(body);
				let title = content.title;
				var baseurl = content.url;

				let callback = function () {
					let up = {
						body: `${title}`,
						attachment: fs.createReadStream(__dirname + "/src/meme.jpg")
					};
					api.sendMessage(up, threadID, () => {
						fs.unlinkSync(__dirname + "/src/meme.jpg")
					}, messageID);
				};
				request(baseurl).pipe(fs.createWriteStream(__dirname + `/src/meme.jpg`)).on("close", callback);
			});

		if (contentMessage.indexOf(`${prefix}gif`) == 0) {
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			if (content.length == -1) return api.sendMessage(`Bạn đã nhập sai format, vui lòng !help gif để biết thêm chi tiết!`, threadID, messageID);
			if (content.indexOf(`cat`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=cat&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					console.log(stringURL);
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + `/src/randompic.gif`)
						};
						api.sendMessage(up, threadID, () =>
							fs.unlinkSync(__dirname + `/src/randompic.gif`)
						);
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + `/src/randompic.gif`)).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`dog`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=dog&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						};
						api.sendMessage(up, threadID, () =>
							fs.unlinkSync(__dirname + "/src/randompic.gif")
						);
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`capoo`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=capoo&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						};
						api.sendMessage(up, threadID, () =>
							fs.unlinkSync(__dirname + "/src/randompic.gif")
						);
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`mixi`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=mixigaming&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						};
						api.sendMessage(up, threadID, () =>
							fs.unlinkSync(__dirname + "/src/randompic.gif")
						);
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`bomman`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=bommanrage&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						};
						api.sendMessage(up, threadID, () =>
							fs.unlinkSync(__dirname + "/src/randompic.gif")
						);
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}
			else return api.sendMessage('Tag của bạn nhập không tồn tại, vui lòng đọc hướng dẫn sử dụng trong !help gif', threadID, messageID);
		}

		if (contentMessage.indexOf(`${prefix}hug`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/hug', (err, response, body) => {
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 5, contentMessage.length);
				let callback = function () {
					let up = {
						body: tag + ", i wanna hug you ❤️",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					};
					api.sendMessage(up, threadID, () => {
						fs.unlinkSync(__dirname + `/src/anime.${ext}`)
					}, messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		if (contentMessage.indexOf(`${prefix}kiss`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/kiss', (err, response, body) => {
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 6, contentMessage.length);
				let callback = function () {
					let up = {
						body: tag + ", i wanna kiss you ❤️",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					};
					api.sendMessage(up, threadID, () => {
						fs.unlinkSync(__dirname + `/src/anime.${ext}`)
					}, messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		if (contentMessage.indexOf(`${prefix}slap`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/slap', (err, response, body) => {
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 5, contentMessage.length);
				let callback = function () {
					let up = {
						body: tag + ", take this slap 😈",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					};
					api.sendMessage(up, threadID, () => {
						fs.unlinkSync(__dirname + `/src/anime.${ext}`)
					}, messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		/* ==================== General Commands ================ */

		//gọi bot
		if (contentMessage == `${prefix}nhinhi` || contentMessage.indexOf('sumi') == 0)
			return api.sendMessage(`Dạ gọi Nhi Nhi ạ?`, threadID, messageID);

		//lenny
		if (contentMessage == `${prefix}lenny` || contentMessage.indexOf('lenny') == 0)
			return api.sendMessage("( ͡° ͜ʖ ͡°) ", threadID, messageID);

		//mlem
		if (contentMessage == `${prefix}mlem` || contentMessage.indexOf('mlem') == 0)
			return api.sendMessage(" ( ͡°👅 ͡°)  ", threadID, messageID);

		//care
		if (contentMessage == `${prefix}care` || contentMessage.indexOf('care') == 0)
			return api.sendMessage("¯\\_(ツ)_/¯", threadID, messageID);

		//prefix
		if (contentMessage.indexOf(`prefix`) == 0)
			return api.sendMessage(`Prefix is: ${prefix}`, threadID, messageID);

		if (contentMessage.indexOf("credits") == 0)
			return api.sendMessage("Project Sumi-chan-bot được thực hiện bởi:\nSpermLord: https://www.facebook.com/LiterallyASperm\nCatalizCS: https://www.facebook.com/Cataliz2k\nFull source code at: https://github.com/roxtigger2003/Sumi-chan-bot", threadID, messageID);

		//simsimi
		if (contentMessage.indexOf(`${prefix}sim`) == 0) {
			var content = contentMessage.slice(1, contentMessage.length).trim();
			if (!content) return api.sendMessage("Nhập tin nhắn!", threadID, messageID);
			request({
				uri: encodeURI(`http://ghuntur.com/simsim.php?lc=vn&deviceId=&bad=0&txt=${content}`)
			},
				function (error, response, body) {
					if (body.indexOf('https://play.google.com/store') !== -1) return api.sendMessage("Không biết phải trả lời như nào ¯\\_(ツ)_/¯", threadID, messageID);
					return api.sendMessage(body, threadID, messageID);
				});
		}

		//thời tiết
		if (contentMessage.indexOf(`${prefix}weather`) == 0) {
			var city = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (city.length == 0) return api.sendMessage(`Bạn chưa nhập địa điểm, hãy đọc hướng dẫn tại ${prefix}help weather !`, threadID, messageID);

			request(encodeURI("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + openweather + "&units=metric&lang=vi"), (err, response, body) => {
				if (err) throw err;
				var weatherData = JSON.parse(body);

				if (weatherData.cod !== 200)
					return api.sendMessage(
						`Thành phố ${city} không tồn tại!`,
						threadID,
						messageID
					);
				api.sendMessage(
					`☁️ thời tiết
------------------------------
🗺Địa Điểm: ` +
					weatherData.name +
					`\n - 🌡nhiệt độ hiện tại: ` +
					weatherData.main.temp +
					`°C \n - ☁️Bầu trời: ` +
					weatherData.weather[0].description +
					`\n - 💦độ ẩm trong không khí: ` +
					weatherData.main.humidity +
					`% \n - 💨tốc độ gió: ` +
					weatherData.wind.speed +
					`km/h `,
					threadID,
					messageID
				);
			});
			return;
		}

		//say
		if (contentMessage.indexOf(`${prefix}say`) == 0) {
			const tts = require("./modules/say");
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);

			let callback = function () {
				let m = {
					body: "",
					attachment: fs.createReadStream(__dirname + "/src/say.mp3")
				};
				api.sendMessage(m, threadID, () => {
					fs.unlinkSync(__dirname + "/src/say.mp3");
				});
			};
			if (contentMessage.indexOf("jp") == 5)
				tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length), "ja", callback);
			else if (contentMessage.indexOf("en") == 5)
				tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length), "en-US", callback);
			else if (contentMessage.indexOf("ko") == 5)
				tts.other(contentMessage.slice(prefix.length + 7, contentMessage.lenght), "ko", callback);
			else if (contentMessage.indexOf("ru") == 5)
				tts.other(contentMessage.slice(prefix.lenght + 7, contentMessage.lenght), "ru", callback);
			else tts.vn(content, callback);
			return;
		}

		//cập nhật tình hình dịch
		if (contentMessage == `${prefix}covid`)
			return request("https://code.junookyo.xyz/api/ncov-moh/data.json", (err, response, body) => {
				if (err) throw err;
				var data = JSON.parse(body);
				api.sendMessage(
					"Thế giới:" +
					"\n- Nhiễm: " + data.data.global.cases +
					"\n- Chết: " + data.data.global.deaths +
					"\n- Hồi phục: " + data.data.global.recovered +
					"\nViệt Nam:" +
					"\n- Nhiễm: " + data.data.vietnam.cases +
					"\n- Chết: " + data.data.vietnam.deaths +
					"\n- Phục hồi: " + data.data.vietnam.recovered,
					threadID,
					messageID
				);
			});

		//tuỳ chọn
		if (contentMessage.indexOf(`${prefix}choose`) == 0) {
			var input = contentMessage.slice(prefix.length + 7, contentMessage.length).trim();
			if (!input) return api.sendMessage(`Bạn không nhập đủ thông tin kìa :(`, threadID, messageID);
			var array = input.split(" | ");
			var rand = Math.floor(Math.random() * array.length);

			api.sendMessage(`hmmmm, em sẽ chọn giúp cho là: ` + array[rand] + `.`, threadID, messageID);
			return;
		}

		//waifu
		if (contentMessage === `${prefix}waifu`) {
			var route = Math.round(Math.random() * 10);
			if (route == 1 || route == 0) {
				api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
				api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
				return;
			}
			else if (route == 2) return api.sendMessage("Làm Bạn thôi nhé :'(", threadID, messageID);
			else if (route == 3) {
				api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
				api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
				return;
			}
			else if (route > 4) {
				api.sendMessage("-.-", threadID, messageID);
				api.sendMessage("Chúng ta chỉ là bạn thôi :'(", threadID, messageID);
				return;
			}
		}

		//ramdom con số
		if (contentMessage == `${prefix}roll`)
			return api.sendMessage("Your Number is " + Math.round(Math.random() * 100), threadID, messageID);

		//tát người bạn
		if (contentMessage.indexOf(`${prefix}tát`) == 0) {
			for (var i = 0; i < Object.keys(event.mentions).length; i++) {
				var x = contentMessage.slice(prefix.length + 5, contentMessage.length).trim();
				if (Object.keys(event.mentions)[i] == api.getCurrentUserID())
					return api.sendMessage(`Có ngu đâu mà tát bản thân 😏`, threadID, messageID);
				api.sendMessage(
					{
						body: x + " Vừa Bị Vả Vỡ Mồm",
						mentions: [
							{
								tag: x,
								id: Object.keys(event.mentions)[i]
							}
						]
					},
					threadID,
					messageID
				);
			}
			return;
		}

		if (contentMessage.indexOf(`${prefix}đấm`) == 0) {
			for (var i = 0; i < Object.keys(event.mentions).length; i++) {
				var x = contentMessage.slice(prefix.length + 4, contentMessage.length).trim();
				if (Object.keys(event.mentions)[i] == api.getCurrentUserID())
					return api.sendMessage(`Có ngu đâu mà đấm bản thân 😏`, threadID);
				api.sendMessage(
					{
						body: x + " vừa bị đấm cho thọt 2 hòn lên họng",
						mentions: [
							{
								tag: x,
								id: Object.keys(event.mentions)[i]
							}
						]
					},
					threadID,
					messageID
				);
			}
			return;
		}

		//Khiến bot nhái lại tin nhắn bạn
		if (contentMessage.indexOf(`${prefix}echo`) == 0)
			return api.sendMessage(contentMessage.slice(prefix.length + 5, contentMessage.length), threadID);

		//rank
		if (contentMessage.indexOf(`${prefix}rank`) == 0) {
			const createCard = require("../controllers/rank_card");
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (content.length == 0) {
				api.getUserInfo(senderID, (err, result) => {
					if (err) return modules.log(err, 2);
					const { name } = result[senderID];

					Rank.getPoint(senderID).then(point => createCard({ id: senderID, name, ...point })).then(path =>
						api.sendMessage(
							{
								body: "",
								attachment: fs.createReadStream(path)
							},
							threadID, () => fs.unlinkSync(path), messageID)
					);
				});
				return;
			}
			else if (content.indexOf("@") !== -1) {
				for (var i = 0; i < Object.keys(event.mentions).length; i++) {
					let id = Object.keys(event.mentions)[i];
					console.log(id);
					api.getUserInfo(id, (err, result) => {
						if (err) return modules.log(err, 2);
						const { name } = result[id];
						console.log(name);

						Rank.getPoint(id).then(point => createCard({ id: id, name, ...point })).then(path =>
							api.sendMessage(
								{
									body: "",
									attachment: fs.createReadStream(path)
								},
								threadID, () => fs.unlinkSync(path), messageID)
						);
					});
				}
				return;
			}
			else if (!content) {
				api.getUserInfo(content, (err, result) => {
					if (err) return modules.log(err, 2);
					const { name } = result[content];

					Rank.getPoint(content).then(point => createCard({ id: content, name, ...point })).then(path =>
						api.sendMessage(
							{
								body: "",
								attachment: fs.createReadStream(path)
							},
							threadID, () => fs.unlinkSync(path), messageID)
					);
				});
				return;
			}
			return;
		}

		//dịch ngôn ngữ
		if (contentMessage.indexOf(`${prefix}trans`) == 0) {
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			if (content.length == 0) return api.sendMessage("Bạn chưa nhập thông tin, vui lòng đọc !help để biết thêm chi tiết!", threadID, messageID);
			if (content.indexOf("->") !== -1) {
				var string = content.indexOf("->");
				var rightString = content.slice(string + 2, string.length);
				var leftString = content.slice(0, string - 1);
				if (rightString.length !== 0 && leftString.length !== 0) {
					request({ uri: encodeURI(`https://translate.yandex.net/api/v1.5/tr.json/translate?key=${yandex}&text=${leftString}&lang=${rightString}`) }, (err, response, body) => {
						var retrieve = JSON.parse(body);
						var convert = retrieve.text[0];
						var language = retrieve.lang;
						var splitLang = language.split("-");
						var fromLang = splitLang[0];
						var toLang = splitLang[1];
						if (err) return api.sendMessage("Server đã xảy ra vấn đề, vui lòng báo lại cho admin!!!", threadID, messageID);
						// return api.sendMessage("'" + convert + "' được dịch từ " + fromLang + " sang " + toLang, threadID, messageID);
						return api.sendMessage("Result: " + convert, threadID, messageID);
					});
				}
				else return api.sendMessage("Bạn đã nhập sai format! vui lòng đọc hướng dẫn sử dụng trong !help", threadID, messageID);
			}
		}

		//châm ngôn sống
		if (contentMessage == `${prefix}quotes`) {
			fs.readFile(__dirname + "/src/quotes.json", "utf-8", function (err, data) {
				var stringData = JSON.parse(data);
				var randomQuotes = stringData[Math.floor(Math.random() * stringData.length)];
				api.sendMessage('Quote: \n "' + randomQuotes.text + '"\n     -' + randomQuotes.author + "-", threadID, messageID);
			});
			return;
		}

		//khiến bot làm toán ?!
		if (contentMessage.indexOf(`${prefix}math`) == 0) {
			const wolfram = "http://api.wolframalpha.com/v2/result?appid=" + wolfarm + "&i=";
			var m = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var o = m.replace(/ /g, "+");
			var l = "http://lmgtfy.com/?q=" + o;
			request(wolfram + encodeURIComponent(m), function (err, response, body) {
				if (body.toString() === "Wolfram|Alpha did not understand your input") return api.sendMessage(l, threadID, messageID);
				else if (body.toString() === "Wolfram|Alpha did not understand your input") return api.sendMessage("I don't understand your question :3", threadID, messageID);
				else if (body.toString() === "My name is Wolfram Alpha.") return api.sendMessage("My name is Sumi-chan.", threadID, messageID);
				else if (body.toString() === "I was created by Stephen Wolfram and his team.") return api.sendMessage("I Was Created by Catalizcs, I love him too <3", threadID, messageID);
				else if (body.toString() === "I am not programmed to respond to this dialect of English.") return api.sendMessage("Tôi không được lập trình để nói những thứ vô học như này\n:)", threadID, messageID);
				else if (body.toString() === "StringJoin(CalculateParse`Content`Calculate`InternetData(Automatic, Name))") return api.sendMessage("I don't know how to answer this question", threadID, messageID);
				else return api.sendMessage(body, threadID, messageID);
			});
		}

		if (contentMessage == `${prefix}uptime`) {
			var time = process.uptime();
			var minutes = Math.floor((time % (60 * 60)) / 60);
			var seconds = Math.floor(time % 60);
			api.sendMessage(
				"Bot đã hoạt động được " +
				minutes +
				" Phút " +
				seconds +
				" Giây. \nLưu ý: Bot sẽ tự động restart sau khi ! hoạt động!",
				threadID,
				messageID
			);
			return;
		}

		//unsend message
		if (contentMessage.indexOf(`${prefix}gỡ`) == 0) {
			if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage("Không thể gỡ tin nhắn của người khác", threadID, messageID);
			if (event.type != "message_reply") return api.sendMessage("Phản hồi tin nhắn cần gỡ", threadID, messageID);
			return api.unsendMessage(event.messageReply.messageID, err => {
				if (err) return api.sendMessage("Không thể gỡ tin nhắn này vì đã quá 10 phút!", threadID, messageID);
			});
		}

		//get infomation
		if (contentMessage.indexOf(`${prefix}uid`) == 0) {
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			if (!content) return api.sendMessage(`UID của bạn là ${senderID}`, threadID, messageID);
			else if (content.indexOf("@") !== -1) {
				for (var i = 0; i < Object.keys(event.mentions).length; i++) {
					api.sendMessage(`UID của ${content.slice(1, content.length)} là ${Object.keys(event.mentions)[i]}`, threadID, messageID);
				}
				return;
			}
		}

		//wiki
		if (contentMessage.indexOf(`${prefix}wiki`) == 0) {
			const wiki = require("wikijs").default;
			var url = 'https://vi.wikipedia.org/w/api.php';
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (contentMessage.indexOf("-en") == 6) {
				url = 'https://en.wikipedia.org/w/api.php';
				content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			}
			if (!content) return api.sendMessage("Nhập thứ cần tìm!", threadID, messageID);

			wiki({ apiUrl: url }).page(content).catch((err) => api.sendMessage("Không tìm thấy " + content, threadID, messageID))
				.then(page => {
					if (typeof page == 'undefined') return;
					Promise.resolve(page.summary()).then(val => api.sendMessage(val, threadID, messageID));
				});
			return;
		}

		//ping
		if (contentMessage == `${prefix}ping`)
			return api.getThreadInfo(threadID, function (err, info) {
				if (err) throw err;
				let ids = info.participantIDs;
				let botid = api.getCurrentUserID();
				let callid = {
					body: "Ping🏓",
					mentions: [
						{
							tag: `${botid}`,
							id: botid
						}
					]
				};
				ids.forEach(getid => {
					if (id != botid) {
						var addthis = {
							tag: `${id}`,
							id: id
						}
						callid["mentions"].push(addthis);
					}
				});
				api.sendMessage(callid, threadID, messageID);
			});

		/* ==================== NSFW Commands ==================== */

		/* ==================== Game Commands ==================== */

		//lấy thông tin osu!
		if (contentMessage.indexOf(`${prefix}osuinfo -u`) == 0) {
			const osu = require("node-osu");
			var username = contentMessage.slice(prefix.length + 11, contentMessage.length).trim();
			if (!osuAPI || osuAPI == undefined) return api.sendMessage("Bot chưa có steam api!!", threadID, messageID);
			var osuApi = new osu.Api(`${osuAPI}`, {
				notFoundAsError: true,
				completeScores: false
			});
			osuApi.apiCall("/get_user", { u: username }).then(user => {
				api.sendMessage(
					`OSU INFO\n - username : ` +
					user[0].username +
					`\n - level :` +
					user[0].level +
					`\n - playcount :` +
					user[0].playcount +
					`\n - CountryRank : ` +
					user[0].pp_country_ran +
					`\n - Total PP* : ` +
					user[0].pp_raw +
					`\n - Hit Accuracy :` +
					user[0].accuracy,
					threadID,
					messageID
				);
			});
			return;
		}

		/*
		* Todo list:
		- Game CSGO: done
		- Game Dota2
		- More and More
		*/

		/* ==================== Economy and Minigame Commands ==================== */

		//coinflip
		if (contentMessage.indexOf(`${prefix}coinflip`) == 0) {
			if (Math.floor(Math.random() * Math.floor(2)) === 0) return api.sendMessage("Mặt ngửa!", threadID, messageID);
			else return api.sendMessage("Mặt sấp!", threadID, messageID);
		}

		//balance
		if (contentMessage.indexOf(`${prefix}balance`) == 0) {
			var content = contentMessage.slice(prefix.length + 8, contentMessage.length);
			var mention = Object.keys(event.mentions)[0];
			if (!content)
				return economy.getMoney(senderID).then(function (moneydb) {
					api.sendMessage(`Số tiền của bạn hiện đang có là: ${moneydb}$`, threadID, messageID);
				});
			else if (content.indexOf("@") !== -1) {
				economy.getMoney(mention).then(function (moneydb) {
					api.sendMessage(
						{
							body: `Số tiền của ${event.mentions[mention].replace("@", "")} hiện đang có là: ${moneydb}$.`,
							mentions: [
								{
									tag: event.mentions[mention].replace("@", ""),
									id: mention
								}
							]
						},
						threadID,
						messageID
					);
				});
				return;
			}
			else if (!isNaN(content))
				return economy.getMoney(content).then(function (moneydb) {
					api.sendMessage(`Số tiền của user ${content} hiện đang có là: ${moneydb}$`, threadID, messageID);
				});
		}

		if (contentMessage.indexOf(`${prefix}daily`) == 0) {
			let cooldown = 8.64e7; //86400000;
			let amount = 500;
			economy.getDailyTime(senderID).then(function (lastDaily) {
				if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
					let time = ms(cooldown - (Date.now() - lastDaily));
					api.sendMessage(
						"Bạn đã nhận phần thưởng của ngày hôm nay, vui lòng quay lại sau: " +
						time.hours +
						" giờ " +
						time.minutes +
						" phút " +
						time.seconds +
						" giây ",
						threadID,
						messageID
					);
				}
				else {
					api.sendMessage(
						"Bạn đã nhận phần thưởng của ngày hôm nay. Cố gắng lên nhé <3",
						threadID,
						() => {
							economy.updateMoney(senderID, amount);
							economy.updateDailyTime(senderID, Date.now());
							modules.log("User: " + senderID + " nhận daily thành công!");
						},
						messageID
					);
				}
			});
			return;
		}

		if (contentMessage.indexOf(`${prefix}buff`) == 0) {
			let amount = 9999;
			api.sendMessage(
				"Lại buff tiền à! Không làm mà đòi có ăn! Dit me may nha -.-",
				threadID,
				() => {
					economy.updateMoney(senderID, amount);
					modules.log("User: " + senderID + " buff $$$ thành công!");
				},
				messageID
			);
			return;
		}

		if (contentMessage == `${prefix}thăm ngàn`) {
			let cooldown = 600000;
			economy.getWorkTime(senderID).then(function (lastWork) {
				if (lastWork !== null && cooldown - (Date.now() - lastWork) > 0) {
					let time = ms(cooldown - (Date.now() - lastWork));
					api.sendMessage(
						"Bạn đã thăm ngàn, để tránh bị kiệt sức vui lòng quay lại sau: " +
						time.minutes +
						" phút " +
						time.seconds +
						" giây ",
						threadID,
						messageID
					);
				}
				else {
					let job = [
						"sửa xe",
						"coder dạo",
						"chạy grab dạo",
						"bán vé số dạo",
						"bán bao cao su dạo",
						"shipper dạo",
						"h@ck3r facebook",
						"thợ sửa ống nước ( ͡° ͜ʖ ͡°)",
						"đầu bếp",
						"fuho",
						"fake taxi",
						"gangbang người khác",
						"re sờ chym mờ",
						"bán hàng online",
						"làm casi",
						"làm con của Bill Gates",
						"chui chạn",
						"nội trợ",
						"làm phò ở cầu vượt Quang Trung",
						"đóng phim VAV cho Trời Đất",
						"vả mấy thằng sao đỏ, giun vàng",
						"bán hoa",
						"tìm jav/hentai code cho SpermLord"
					];
					let result = Math.floor(Math.random() * job.length);
					let amount = Math.floor(Math.random() * 1000);
					api.sendMessage(
						"Bạn đã làm công việc " +
						job[result] +
						" và đã nhận được số tiền là: " +
						amount +
						"$",
						threadID,
						() => {
							economy.updateMoney(senderID, amount);
							economy.updateWorkTime(senderID, Date.now());
							modules.log("User: " + senderID + " nhận job thành công!");
						},
						messageID
					);
				}
			});
			return;
		}

		if (contentMessage.indexOf(`${prefix}roul`) == 0) {
			economy.getMoney(senderID).then(function (moneydb) {
				var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn chưa nhập thông tin đặt cược!`, threadID, messageID);
				var string = content.split(" ");
				var color = string[0];
				var money = string[1];

				function checker(num) {
					if (num == 0) return 'green';
					else if (num % 2 == 0 && num % 6 != 0 && num % 10 != 0) return 'red';
					else if (num % 3 == 0 && num % 6 != 0) return 'blue';
					else if (num % 5 == 0 && num % 10 != 0) return 'yellow';
					else if (num % 10 == 0) return 'purple';
					else {
						return 'black';
					}
				}

				let random = Math.floor(Math.random() * 50);
				if (isNaN(money) || money.indexOf("-") !== -1)
					return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại !help roul`, threadID, messageID);
				if (!money || !color)
					return api.sendMessage("Sai format", threadID, messageID);
				if (money > moneydb)
					return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 10)
					return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 10$!`, threadID, messageID);
				if (color == "g" || color.includes("green")) color = 0;
				else if (color == "r" || color.includes("red")) color = 1;
				else if (color == "x" || color.includes("blue")) color = 2;
				else if (color == "y" || color.includes("yellow")) color = 3;
				else if (color == "p" || color.includes("purple")) color = 4;
				else if (color == "p" || color.includes("black")) color = 5;
				else return api.sendMessage("Bạn chưa nhập thông tin cá cược!, red [1.5x] black [2x] green [15x]", threadID, messageID);

				if (checker(random) == 'green') api.sendMessage("Màu 💚", threadID, messageID);
				else if (checker(random) == 'red') api.sendMessage("Màu ❤️", threadID, messageID);
				else if (checker(random) == 'blue') api.sendMessage("Màu 💙", threadID, messageID);
				else if (checker(random) == 'yellow') api.sendMessage("Màu 💛", threadID, messageID);
				else if (checker(random) == 'purple') api.sendMessage("Màu 💜", threadID, messageID);
				else if (checker(random) == 'black') api.sendMessage("Màu 🖤", threadID, messageID);

				if (checker(random) == 'green' && color == 0) {
					money *= 20;
					api.sendMessage(`Bạn đã chọn màu 💚, bạn đã thắng với số tiền được nhân lên 20: ${money *= 15}$`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on green`);
				}
				else if (checker(random) == 'red' && color == 1) {
					money = parseInt(money * 1);
					api.sendMessage(`Bạn đã chọn màu ❤️, bạn đã thắng với số tiền nhân lên 1: ${money}$`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on red`);
				}
				else if (checker(random) == 'blue' && color == 2) {
					money = parseInt(money * 1.5);
					api.sendMessage(`Bạn đã chọn màu 💙, bạn đã thắng với số tiền nhân lên 1.5: ${money}$`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on black`);
				}
				else if (checker(random) == 'yellow' && color == 3) {
					money = parseInt(money * 3);
					api.sendMessage(`Bạn đã chọn màu 💛, bạn đã thắng với số tiền nhân lên 3: ${money}$`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on black`);
				}
				else if (checker(random) == 'purple' && color == 4) {
					money = parseInt(money * 5);
					api.sendMessage(`Bạn đã chọn màu 💜, bạn đã thắng với số tiền nhân lên 5: ${money}$`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on black`);
				}
				else if (checker(random) == 'black' && color == 5) {
					money = parseInt(money * 0.5);
					api.sendMessage(`Bạn đã chọn màu 🖤️, bạn đã thắng với số tiền nhân lên 0.5: ${money}$`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on black`);
				}
				else return api.sendMessage(`Bạn đã ra đê ở và mất trắng số tiền: ${money}$ :'(`, threadID, () => economy.subtractMoney(senderID, money), messageID);
			});
			return;
		}

		//slot
		if (contentMessage.indexOf(`${prefix}sl`) == 0) {
			const slotItems = ["🍇", "🍉", "🍊", "🍏", "7⃣", "🍓", "🍒"];
			economy.getMoney(senderID).then(function (moneydb) {
				var content = contentMessage.slice(prefix.length + 3, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn chưa nhập thông tin đặt cược!`, threadID, messageID);
				var string = content.split(" ");
				var money = string[0];
				let win = false;
				if (isNaN(money) || money.indexOf("-") !== -1)
					return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại !help sl`, threadID, messageID);
				if (!money)
					return api.sendMessage("Chưa nhập số tiền đặt cược!", threadID, messageID);
				if (money > moneydb)
					return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 50)
					return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 50$!`, threadID, messageID);

				let number = [];
				for (i = 0; i < 3; i++) {
					number[i] = Math.floor(Math.random() * slotItems.length);
				}

				if (number[0] == number[1] && number[1] == number[2]) {
					money *= 9;
					win = true;
				}
				else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
					money *= 2;
					win = true;
				}

				if (win) {
					api.sendMessage(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]} \n\nBạn đã thắng, toàn bộ ${money}$ thuộc về bạn`, threadID, messageID);
					economy.updateMoney(senderID, money);
				}
				else {
					api.sendMessage(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]} \n\nBạn đã thua, toàn bộ ${money}$ bay vào không trung xD`, threadID, messageID);
					economy.subtractMoney(senderID, money);
				}
			});
			return;
		}

		//bau cua
		if (contentMessage.indexOf(`${prefix}baucua`) == 0) {
			const slotItems = ["bau", "cua", "tom", "ca", "ga", "nai"];
			const convat = ["🍑", "🦀", "🦐", "🐟", "🐔", "🦌"];
			economy.getMoney(senderID).then(function (moneydb) {
				var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn không nhập đủ thông tin kìa :(`, threadID, messageID);
				var string = content.split(" ");
				var baucua = string[0];
				var money = string[1];
				let win = false;
				var choose = "";

				if (baucua == slotItems[0])
					choose = 0;
				else if (baucua == slotItems[1])
					choose = 1;
				else if (baucua == slotItems[2])
					choose = 2;
				else if (baucua == slotItems[3])
					choose = 3;
				else if (baucua == slotItems[4])
					choose = 4;
				else if (baucua == slotItems[5])
					choose = 5;
				else
					return api.sendMessage(`Vui lòng nhập đúng con, chi tiết tại !help baucua`, threadID, messageID);

				if (isNaN(money) || money.indexOf("-") !== -1)
					return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại !help sl`, threadID, messageID);
				if (!money)
					return api.sendMessage("Chưa nhập số tiền đặt cược!", threadID, messageID);
				if (money > moneydb)
					return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 10)
					return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 10$!`, threadID, messageID);


				let number = [];
				for (i = 0; i < 3; i++) {
					number[i] = Math.floor(Math.random() * 6);
				}

				let result = number.filter(word => word == choose).length;
				if (result == 3) {
					money *= 3;
					win = true;
				}
				else if (result == 2) {
					money *= 2;
					win = true;
				}
				else if (result == 1) {
					money *= 1;
					win = true;
				} else {
					win = false;
				}

				if (win) {
					api.sendMessage(`${convat[number[0]]} | ${convat[number[1]]} | ${convat[number[2]]} \n\nBạn đã thắng, toàn bộ ${money}$ thuộc về bạn`, threadID, messageID);
					economy.updateMoney(senderID, money);
				}
				else {
					api.sendMessage(`${convat[number[0]]} | ${convat[number[1]]} | ${convat[number[2]]} \n\nBạn đã thua, toàn bộ ${money}$ bay vào không trung xD`, threadID, messageID);
					economy.subtractMoney(senderID, money);
				}
			});
			return
		}
		//pay command
		if (contentMessage.indexOf(`${prefix}pay`) == 0) {
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			var moneyPay = content.substring(content.lastIndexOf(" ") + 1);

			economy.getMoney(senderID).then((moneydb) => {
				if (!moneyPay) return api.sendMessage("bạn chưa nhập số tiền cần chuyển!", threadID, messageID);
				if (isNaN(moneyPay) || moneyPay.indexOf("-") !== -1)
					return api.sendMessage('số tiền bạn nhập không hợp lệ, vui lòng xem lại cách sử dụng tại !help pay', threadID, messageID);
				if (moneyPay > moneydb)
					return api.sendMessage('Số tiền mặt trong người bạn không đủ, vui lòng kiểm tra lại số tiền bạn đang có!', threadID, messageID);
				if (moneyPay < 1)
					return api.sendMessage(`Số tiền cần chuyển của bạn quá nhỏ, tối thiểu là 1$!`, threadID, messageID);

				api.sendMessage(
					{
						body: `Bạn đã chuyển ${moneyPay}$ cho ${event.mentions[mention].replace("@", "")}.`,
						mentions: [
							{
								tag: event.mentions[mention].replace("@", ""),
								id: mention
							}
						]
					},
					threadID,
					() => {
						economy.updateMoney(mention, parseInt(moneyPay));
						economy.subtractMoney(senderID, parseInt(moneyPay));
					},
					messageID
				);
			});
			return;
		}

		//setmoney command
		if (contentMessage.indexOf(`${prefix}setmoney`) == 0 && admins.includes(senderID)) {
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			var sender = content.slice(0, content.lastIndexOf(" "));
			var moneyPay = content.substring(content.lastIndexOf(" ") + 1);
			economy.getMoney(senderID).then((moneydb) => {
				if (isNaN(moneyPay))
					return api.sendMessage('số tiền cần set của bạn không phải là 1 con số!!', threadID, messageID);
				if (moneydb == undefined)
					return api.sendMessage('user cần set chưa tồn tại trên hệ thống dữ liệu!', threadID, messageID);
				if (!mention && sender == 'me') return api.sendMessage("Đã sửa tiền của bản thân thành " + moneyPay, threadID, () => economy.setMoney(senderID, parseInt(moneyPay)), messageID);
				api.sendMessage(
					{
						body: `Bạn đã sửa tiền của ${event.mentions[mention].replace("@", "")} thành ${moneyPay}$.`,
						mentions: [
							{
								tag: event.mentions[mention].replace("@", ""),
								id: mention
							}
						]
					},
					threadID,
					() => economy.setMoney(mention, parseInt(moneyPay)),
					messageID
				);
			});
			return;
		}

		/* ==================== Media Commands ==================== */

		//get video facebook
		if (contentMessage.indexOf(`${prefix}facebook -p`) == 0) {
			var content = contentMessage.slice(prefix.length + 12, contentMessage.length);
			const media = require("./modules/media");
			if (!content) return api.sendMessage(`Bạn chưa nhập thông tin cần thiết!`, threadID, messageID);
			api.sendMessage("Đợi em một xíu...", threadID, messageID);
			require("fb-video-downloader").getInfo(content).then(info => {
				let gg = JSON.stringify(info, null, 2);
				let data = JSON.parse(gg);
				let callback = function () {
					let up = {
						body: "",
						attachment: fs.createReadStream(__dirname + "/src/video.mp4")
					};
					api.sendMessage(up, threadID, () => fs.unlinkSync(__dirname + "/src/video.mp4"));
				};
				media.facebookVideo(data.download.sd, callback);
			});
			return;
		}

		//get video youtube
		if (contentMessage.indexOf(`${prefix}youtube -p`) == 0) {
			const media = require("./modules/media");
			var content = contentMessage.slice(prefix.length + 11, contentMessage.length);
			const ytdl = require("ytdl-core");
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);

			if (content.indexOf('https') == -1 || content.indexOf('http') == -1) {
				request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${googleSearch}&q=${encodeURIComponent(content)}`,
					(err, response, body) => {
						if (err) return api.sendMessage("Lỗi cmnr :|", threadID, messageID);;
						var retrieve = JSON.parse(body);
						var content = "https://www.youtube.com/watch?v=" + retrieve.items[0].id.videoId;
						var title = retrieve.items[0].snippet.title;
						var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
						let callback = function () {
							let up = {
								body: ``,
								attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
							};
							api.sendMessage(
								title,
								threadID,
								() => {
									api.sendMessage(up, threadID, () => {
										fs.unlinkSync(__dirname + "/src/thumbnails.png");
										api.sendMessage(content, threadID, () => getVideo(content));
									});
								},
								messageID
							);
						};
						request(thumbnails).pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`)).on("close", callback);
					});
			}
			else getVideo(content);
			function getVideo(content) {
				ytdl.getInfo(content, function (err, info) {
					if (err) return api.sendMessage('Link youtube không hợp lệ!', threadID, messageID);
					if (info.length_seconds > 3600) return api.sendMessage("Độ dài video vượt quá mức cho phép, tối đa là 60 phút!", threadID, messageID);
					api.sendMessage("Đợi em một xíu em đang xử lý...", threadID, messageID);
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/video.mp4")
						};
						api.sendMessage(up, threadID, () => fs.unlinkSync(__dirname + "/src/video.mp4"));
					};
					media.youtubeVideo(content, callback);
				});
			};
			return;
		}

		//get audio youtube
		if (contentMessage.indexOf(`${prefix}youtube -m`) == 0) {
			const media = require("./modules/media");
			var content = contentMessage.slice(prefix.length + 11, contentMessage.length);
			const ytdl = require("ytdl-core");
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);

			if (content.indexOf('https') == -1 || content.indexOf('http') == -1) {
				request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${googleSearch}&q=${encodeURIComponent(content)}`,
					(err, response, body) => {
						if (err) return api.sendMessage("Lỗi cmnr :|", threadID, messageID);;
						var retrieve = JSON.parse(body);
						var content = "https://www.youtube.com/watch?v=" + retrieve.items[0].id.videoId;
						var title = retrieve.items[0].snippet.title;
						var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
						let callback = function () {
							let up = {
								body: ``,
								attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
							};
							api.sendMessage(
								title,
								threadID,
								() => {
									api.sendMessage(up, threadID, () => {
										fs.unlinkSync(__dirname + "/src/thumbnails.png");
										api.sendMessage(content, threadID, () => getMusic(content));
									});
								},
								messageID
							);
						};
						request(thumbnails).pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`)).on("close", callback);
					});
			}
			else getMusic(content);
			function getMusic(content) {
				ytdl.getInfo(content, function (err, info) {
					if (err) return api.sendMessage('Link youtube không hợp lệ!', threadID, messageID);
					if (info.length_seconds > 3600) return api.sendMessage("Độ dài video vượt quá mức cho phép, tối đa là 60 phút!", threadID, messageID);
					api.sendMessage("Đợi em một xíu em đang xử lý...", threadID, messageID);
					let callback = function () {
						let up = {
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/music.mp3")
						};
						api.sendMessage(up, threadID, () => fs.unlinkSync(__dirname + "/src/music.mp3"));
					};
					media.youtubeMusic(content, callback);
				});
			};
			return;
		}

		if (contentMessage.indexOf(`${prefix}instagram `) == 0) {
			var content = contentMessage.slice(prefix.length + 10, contentMessage.length);
			console.log(content);
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);
			request(`https://api.instagram.com/oembed?url=${content}`, (err, response, body) => {
				if (err) return api.sendMessage("Lỗi cmnr :|", threadID, messageID);
				if (response.statusCode == 200) {
					let picData = JSON.parse(body);
					let getURL = picData.thumbnail_url;
					let ext = 'jpg';
					console.log(getURL);
					let callback = function () {
						let up = {
							body: "",
							mentions: [
								{
									tag: '',
									id: Object.keys(event.mentions)[0]
								}
							],
							attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
						};
						api.sendMessage(up, threadID, () => {
							fs.unlinkSync(__dirname + `/src/anime.${ext}`)
						}, messageID);
					};
					request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
				}
			});
		}


	};
};
/* This bot was made by Catalizcs(roxtigger2003) and SpermLord(spermlord) with love <3, pls dont delete this credits! THANKS very much */