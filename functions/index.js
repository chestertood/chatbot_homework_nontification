//firebase deploy --only functions
const functions = require('firebase-functions');
const axios = require('axios');
const { google } = require('googleapis');
const admin = require('firebase-admin');
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
admin.initializeApp();

const privateKey = process.env.GOOGLE_SHEETS_KEY;

const auth = new google.auth.GoogleAuth({
  credentials: {
    private_key: privateKey,
    client_email: 'sheetapi@test01-205c7.iam.gserviceaccount.com',
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});


const parseDate_Now = (dateStr) => {
  const dateParts = dateStr.split(' ')[0].split('/');
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;  // month in JavaScript starts from 0
  const year = parseInt(dateParts[2], 10); // ปีจะอยู่ในรูป 25 ให้เป็น 2025

  return moment({ year, month, day });
};

const sheets = google.sheets({ version: 'v4', auth });

const db = admin.firestore(); 

exports.webhookfunction = functions.https.onRequest(async (request, response)  => {
  console.log("📌 Full Request Body:", JSON.stringify(request.body, null, 2));
  const body = request.body;
  

  // ตรวจ intent ว่าตรงกับ "nontiHW" หรือไม่
  if (body.queryResult.intent.displayName === 'nontiHW') {
    try {
      const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
      const range = '2ndFeature!A2:D';

      const head = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });

      const head1 = head.data.values || [];
      let flexMessages = [];
      time_array = []
      for (let j = 0; j < head1.length; j++) {
        const row = head1[j];
        const times = parseDate_Now(row[2])
        time_array.push({ time: times.valueOf(), index: j });
      }

      time_array.sort((a, b) => a.time - b.time);
      const sortedIndices = time_array.map(item => item.index);
      
      for (let i = 0; i < sortedIndices.length; i++) {
        const row = head1[sortedIndices[i]];
        const shortUrl = row[3] || '-';

        const flexMessage = {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: `📌 วิชา: ${row[0] || '-'}`, weight: "bold", size: "md" ,wrap: true},
              { type: "text", text: `📖 หัวข้อ: ${row[1] || '-'}`, wrap: true },
              { type: "text", text: `📝 ส่งก่อนวันที่: ${row[2] || '-'}`, wrap: true, size: "sm" },
              {
                type: "button",
                style: "link",
                action: {
                  type: "uri",
                  label: "🔗 กดลิงค์นี้",
                  uri: shortUrl
                }
              }
            ]
          }
        };

        flexMessages.push(flexMessage);
      }

      return response.json({
        fulfillmentMessages: [
          {
            payload: {
              line: {
                type: "flex",
                altText: "ข้อความจากเรา",
                contents: {
                  type: "bubble",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "image",
                        url: 'https://firebasestorage.googleapis.com/v0/b/test01-205c7.firebasestorage.app/o/462546831_471524282058734_7077054933705155479_n.jpg?alt=media&token=3280fc32-e122-4af5-8081-12475c877c67', // ใส่ URL ของรูปภาพ
                        size: "full",
                        aspectRatio: "16:9",
                        aspectMode: "cover"
                      },
                      {
                        type: "text",
                        text: 'อย่าลืมทำการบ้านจากน้องพริวๆ😘😘', // ข้อความที่คุณต้องการแสดงใต้รูป
                        weight: "bold",
                        size: "md",
                        margin: "sm"
                      }
                    ]
                  }
                }
              }
            }
          },
          {
            payload: {
              line: {
                type: "flex",
                altText: "ข้อความจากเรา",
                contents: {
                  type: "carousel", // ใช้ carousel layout เพื่อให้สามารถมีหลาย bubble
                  contents: flexMessages
                }
              }
            }
          }
        ]
      });
      

    } catch (error) {
      console.error('Error fetching data from Sheets:', error);
      return response.json({
        fulfillmentText: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets',
      });
    }
  }

  // ตรวจ intent ว่าตรงกับ "timetable" หรือไม่
  if (body.queryResult.intent.displayName === 'timetable') {
    try {
      let days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
      const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
      const range = 'sheet2!A2:E';

      const head = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });

      const head1 = head.data.values || [];
      let flexMessages = [];
      const flexMessage = {
        type: "bubble",          
        body: {
          type: "box",
          layout: "vertical",
          contents: []
        }
      };

      flexMessages.push(flexMessage);
      

      for (let i = 0; i < days.length; i++) {              
        const button = 
              {
                type: "button",
                style: "link",
                action: {
                  type: "message",
                  label: `📅 ${days[i]}`,
                  text: `วัน${days[i]}`
                }
              }       
        flexMessages[0].body.contents.push(button);     
        };

        
      return response.json({
        fulfillmentMessages: [
          {
            payload: {
              line: {
                type: "flex",
                altText: "ตารางเรียน",
                contents: {
                  type: "carousel",
                  contents: flexMessages
                }
              }
            }
          }
        ]
      });

    } catch (error) {
      console.error('Error fetching timetable:', error);
      return response.json({
        fulfillmentText: 'เกิดข้อผิดพลาดในการดึงข้อมูลตารางเรียน',
      });
    }
  }

  if (body.queryResult.intent.displayName === 'timetable_custom') {
    
    try {
      const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
      const range = 'sheet2!A2:E';

      const head = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });

      

      const head1 = head.data.values || [];
      let flexMessages = [];
      const selectedDay = body.queryResult.parameters.days;

      for (let i = 0; i < head1.length; i++) {
        const row = head1[i];
        if (row[0]?.trim() == selectedDay){
        
        const flexMessage = {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              { type: "text", text: `🔹 วัน${selectedDay}`, weight: "bold", size: "md" },
              { type: "text", text: `⏰ ${row[1]}`, size: "md" },
              { type: "text", text: `📚 ${row[2]} (${row[3]})`, wrap: true },
              { type: "text", text: `🏫 ห้อง: ${row[4]}`, wrap: true, size: "md" },
                            
            ]
          }
        };

        flexMessages.push(flexMessage);
        }
      }

      return response.json({
        
        fulfillmentMessages: [          
          {
            payload: {
              line: {
                type: "flex",
                altText: "คุณมีงานที่ต้องทำ!",
                contents: {
                  type: "carousel",
                  contents: flexMessages
                }
              }
            }
          }
        ]
      });

    } catch (error) {
      console.error('Error fetching data from Sheets:', error);
      return response.json({
        fulfillmentText: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets',
      });
    }
  }

  if (body.queryResult.intent.displayName === 'ChatBot') {
    try {
      const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
      const range = '3rdFeature!A2:E';

      const head = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });

      const head1 = head.data.values || [];
      let flexMessages = [];
      
    
    let message1 = 'เปิด/ปิด\nโหมดแจ้งเตือนอัตโนมัติไหม';
    
    const button1 = {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: message1,  
            wrap: true,      
            weight: "bold",   
            size: "md",
            align: "center"   // ✅ ทำให้ข้อความอยู่ตรงกลาง
          },          
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "message",
              label: "✅ เปิด",
              text: "เปิด"
            }
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "❌ ปิด",
              text: "ปิด"
            }
          },
          
        ]
      }
    };
    flexMessages.push(button1);
    
    
    
    // ส่งไปยัง LINE
    return response.json({
      fulfillmentMessages: [        
        {
          payload: {
            line: {
              type: "flex",
              altText: "คุณมีงานที่ต้องทำ!",
              contents: {
                type: "carousel",
                contents: flexMessages
              }
            }
          }
        }
      ]
    });
    
  } catch (error) {
    console.error('Error in ChatBot intent:', error);
    return response.json({
      fulfillmentText: 'เกิดข้อผิดพลาดในการส่งคำทักทาย',
    });
    }
  }


  if (body.queryResult.intent.displayName === 'ChatBot_yes') {
    try {
      const userId = body.originalDetectIntentRequest.payload.data.source.userId;;  // รับ userId จาก request
      const status = 'เปิด'; // กำหนดสถานะเป็น 'เปิด'
  
      // บันทึกสถานะใน Firestore
      await db.collection('users').doc(userId).set({
        notificationEnabled: true,
      }, { merge: true });
  
      return response.json({
        fulfillmentText: 'เปิดการแจ้งเตือนแล้ว!',
      });
    } catch (error) {
      console.error('Error in ChatBot_yes intent:', error);
      return response.json({
        fulfillmentText: 'เกิดข้อผิดพลาดในการเปิดการแจ้งเตือน',
      });
    }
  }
  
  if (body.queryResult.intent.displayName === 'ChatBot_no') {
    try {
      const userId = body.originalDetectIntentRequest.payload.data.source.userId;;  // รับ userId จาก request
      const status = 'ปิด'; // กำหนดสถานะเป็น 'ปิด'
  
      // บันทึกสถานะใน Firestore
      await db.collection('users').doc(userId).set({
        notificationEnabled: false,
      }, { merge: true });
  
      return response.json({
        fulfillmentText: 'ปิดการแจ้งเตือนแล้ว!',
      });
    } catch (error) {
      console.error('Error in ChatBot_no intent:', error);
      return response.json({
        fulfillmentText: 'เกิดข้อผิดพลาดในการปิดการแจ้งเตือน',
      });
    }
  }


  
  return response.json({
    fulfillmentText: 'ไม่พบ intent ที่ต้องการ!',
  });

});







const lineApiUrl = 'https://api.line.me/v2/bot/message/push';
const channelAccessToken = 'PbmPV1fK3Fyyx2H78gkip1Jhmy7CG+4/xLKB8WN6PcKSqSL9YLY7O/5+FikY0n2OPY7HuJeisr/+pum/NVYOS/jxtxXaOQq3kiVioSt2YHwN8GdLyB81tkAEMH8dzwlZFKJxE44N58K24irJcve5lwdB04t89/1O/w1cDnyilFU='; // ใส่ Channel Access Token ที่ได้จาก LINE Developers

const moment = require('moment');

const sendMessage = async (userId, message) => {
  try {
    const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
    const range = '2ndFeature!A2:D';

    const head = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const head1 = head.data.values || [];
    let flexMessages = [];

    const currentDate = moment();
    const formattedDate = currentDate.format("DD/MM/YYYY")
    const currentDate_use = parseDate_Now(formattedDate);

    time_array = []
    for (let j = 0; j < head1.length; j++) {
      const row = head1[j];
      const times = parseDate_Now(row[2])
      time_array.push({ time: times.valueOf(), index: j });
    }

    time_array.sort((a, b) => a.time - b.time);
    const sortedIndices = time_array.map(item => item.index);
    

    for (let i = 0; i < sortedIndices.length; i++) {
      const row = head1[sortedIndices[i]];
      const shortUrl = row[3] || '-';
          
      
      const flexMessage = {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: `📌 วิชา: ${row[0] || '-'}`, weight: "bold", size: "md",wrap: true},
            { type: "text", text: `📖 หัวข้อ: ${row[1] || '-'}`, wrap: true },
            { type: "text", text: `📝 ส่งก่อนวันที่: ${row[2] || '-'}`, wrap: true, size: "sm" },
            {
              type: "button",
              style: "link",
              action: {
                type: "uri",
                label: "🔗 กดลิงค์นี้",
                uri: shortUrl
              }
            }
          ]
        }
      };
    
      flexMessages.push(flexMessage);
    
    }
    const response = await axios.post(
      lineApiUrl,
      {
        to: userId, // ใส่ user ID หรือ group ID
        messages: [
          {
            type: "flex",  // เปลี่ยนจาก "text" เป็น "flex"
            altText: "ข้อความจากเรา",  // ข้อความที่จะแสดงในกรณีที่ไม่สามารถแสดง flex message ได้
            contents: {
              type: "bubble", // ต้องใช้ bubble เพื่อกำหนดส่วนของข้อความ
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "image",
                    url: 'https://firebasestorage.googleapis.com/v0/b/test01-205c7.firebasestorage.app/o/462546831_471524282058734_7077054933705155479_n.jpg?alt=media&token=3280fc32-e122-4af5-8081-12475c877c67', // ใส่ URL ของรูปภาพ
                    size: "full",
                    aspectRatio: "16:9",
                    aspectMode: "cover"
                  },
                  {
                    type: "text",
                    text: 'อย่าลืมทำการบ้าน\nจากน้องพริวๆ😘😘', // ข้อความที่คุณต้องการแสดงใต้รูป
                    weight: "bold",
                    size: "md",
                    margin: "sm"
                  }
                ]
              }
            }
          },
          {
            type: "flex",  // เปลี่ยนจาก "text" เป็น "flex"
            altText: "การบ้านวันนนี้",  // ข้อความที่จะแสดงในกรณีที่ไม่สามารถแสดง flex message ได้
            contents: {
              type: "carousel", // ใช้ carousel layout เพื่อให้สามารถมีหลาย bubble
              contents: flexMessages
            }
          }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${channelAccessToken}`,
        },
      }
    );
    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};





exports.dailyNotification = onSchedule({ schedule: '0 18 * * *', timeZone: 'Asia/Bangkok' }, async (event) => {
  try {
    // ดึงข้อมูลผู้ใช้จาก Firestore
   
    const usersSnapshot = await db.collection('users').where('notificationEnabled', '==', true).get();
    const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
    const range = '2ndFeature!A2:D';

    const head = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const head1 = head.data.values || [];
    
    // วนลูปผ่านผู้ใช้ที่เปิดการแจ้งเตือน
    for (let doc of usersSnapshot.docs) {
      const userId = doc.id;     
      
      sendMessage(userId);
      
    }

    console.log("✅ แจ้งเตือนสำเร็จ!");
  } catch (error) {
    console.error("❌ แจ้งเตือนล้มเหลว:", error);
  }
});


const sendschedule = async (userId) => {
  try {
    const sheetId = '1DcrFetSL63UjPjLzYx754xJBTy0IkLWpqJMwtC7rlpY';
    const range = 'sheet2!A2:E';

    const head = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const head1 = head.data.values || [];
    

    const todayThai = new Date().toLocaleDateString('th-TH', { weekday: 'long', timeZone: 'Asia/Bangkok' });    
    const todayThaiShort = todayThai.replace("วัน", "");  
    

    let flexMessages = [];

    for (let i = 0; i < head1.length; i++) {
      const row = head1[i];
      if (row[0]?.trim() == todayThaiShort){
      
      const flexMessage = {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            { type: "text", text: `🔹 วัน${row[0]}`, weight: "bold", size: "md" },
            { type: "text", text: `⏰ ${row[1]}`, size: "md" },
            { type: "text", text: `📚 ${row[2]} (${row[3]})`, wrap: true },
            { type: "text", text: `🏫 ห้อง: ${row[4]}`, wrap: true, size: "md" },
                          
          ]
        }
      };

      flexMessages.push(flexMessage);
      }
    }
    const response = await axios.post(
      lineApiUrl,
      {
        to: userId, // ใส่ user ID หรือ group ID
        messages: [
          {
            type: "flex",  // เปลี่ยนจาก "text" เป็น "flex"
            altText: "ข้อความจากเรา",  // ข้อความที่จะแสดงในกรณีที่ไม่สามารถแสดง flex message ได้
            contents: {
              type: "bubble", // ต้องใช้ bubble เพื่อกำหนดส่วนของข้อความ
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "image",
                    url: 'https://firebasestorage.googleapis.com/v0/b/test01-205c7.firebasestorage.app/o/462546831_471524282058734_7077054933705155479_n.jpg?alt=media&token=3280fc32-e122-4af5-8081-12475c877c67', // ใส่ URL ของรูปภาพ
                    size: "full",
                    aspectRatio: "16:9",
                    aspectMode: "cover"
                  },
                  {
                    type: "text",
                    text: 'ตารางเรียน\nจากน้องพริวๆ😘😘', // ข้อความที่คุณต้องการแสดงใต้รูป
                    weight: "bold",
                    size: "md",
                    margin: "sm"
                  }
                ]
              }
            }
          },
          {
            type: "flex",  // เปลี่ยนจาก "text" เป็น "flex"
            altText: "ตารางเรียนวันนนี้",  // ข้อความที่จะแสดงในกรณีที่ไม่สามารถแสดง flex message ได้
            contents: {
              type: "carousel", // ใช้ carousel layout เพื่อให้สามารถมีหลาย bubble
              contents: flexMessages
            }
          }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${channelAccessToken}`,
        },
      }
    );
    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};



exports.dailyNotification_schedule = onSchedule({ schedule: '0 8 * * 1-5', timeZone: 'Asia/Bangkok' },async (event) => {
  try {
    // ดึงข้อมูลผู้ใช้จาก Firestore
   
    const usersSnapshot = await db.collection('users').where('notificationEnabled', '==', true).get();
    
    // วนลูปผ่านผู้ใช้ที่เปิดการแจ้งเตือน
    for (let doc of usersSnapshot.docs) {
      const userId = doc.id;     
      
      sendschedule(userId);
      
    }
    

    console.log("✅ แจ้งเตือนสำเร็จ!");
  } catch (error) {
    console.error("❌ แจ้งเตือนล้มเหลว:", error);
  }
});