// utils/notification.ts

import { PrismaClient, NotificationType, NotificationStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const prisma = new PrismaClient();

type NotificationInput = {
    type: NotificationType;
    subject: string;
    content: string;
    userId: string;
    contact?: string;
    email?: string;
    options?: any; // options spécifiques au type de notif
};

@Injectable()
export class NotificationService {
    constructor(private readonly mailerService: MailerService) {}

    async sendNotification(data: NotificationInput): Promise<void> {
        // Historique
        await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                subject: data.subject,
                content: data.content,
                contact: data.contact,
                email: data.email,
                pushOptions: data.type === 'PUSH' ? data.options : undefined,
                status: NotificationStatus.PENDING,
            },
        });

        // Dispatcher
        switch (data.type) {
            case 'SMS':
                await this.sendSMS(data);
                break;
            case 'EMAIL':
                await this.sendEmail(data);
                break;
            case 'PUSH':
                await this.sendPush(data);
                break;
        }
    }

    private async sendSMS(data: NotificationInput) {
        if (!data.contact) throw new Error('Contact number is required for SMS');

        console.log(`📲 Sending SMS to ${data.contact}: ${data.content}`);

        // TODO: Integrate with SMS provider (ex: Twilio, Nexmo)
        await prisma.notification.updateMany({
            where: { userId: data.userId, type: 'SMS', subject: data.subject },
            data: { status: NotificationStatus.SENT },
        });
    }

    private async sendEmail(data: NotificationInput) {
        if (!data.email) throw new Error('Email address is required for email notifications');

        console.log(`📧 Sending email to ${data.email}: Subject: ${data.subject}`);

        // Envoi réel avec MailerService
        await this.mailerService.sendMail({
            to: data.email,
            subject: data.subject,
            template: 'default',  // nom du template (dans /templates/default.hbs par ex)
            context: {
                content: data.content,
                // tu peux passer plus de variables au template ici
            },
        });

        // Mise à jour statut
        await prisma.notification.updateMany({
            where: { userId: data.userId, type: 'EMAIL', subject: data.subject },
            data: { status: NotificationStatus.SENT },
        });
    }

    private async sendPush(data: NotificationInput) {
        if (!data.options?.deviceId) throw new Error('Device ID required for push notification');

        console.log(`📱 Sending push notification to device ${data.options.deviceId}`);

        // TODO: Integrate with Firebase Cloud Messaging or OneSignal
        await prisma.notification.updateMany({
            where: { userId: data.userId, type: 'PUSH', subject: data.subject },
            data: { status: NotificationStatus.SENT },
        });
    }
}




// import { NotificationService } from 'util/notification';

// @Injectable()
// export class OrderService {
//   constructor(private readonly notificationService: NotificationService) {}

//   async notifyUser() {
//     await this.notificationService.sendNotification({
//       type: 'EMAIL',
//       subject: 'Votre commande a été validée',
//       content: 'Merci pour votre commande.',
//       userId: 'user-uuid',
//       email: 'client@email.com',
//     });
//   }
// }
