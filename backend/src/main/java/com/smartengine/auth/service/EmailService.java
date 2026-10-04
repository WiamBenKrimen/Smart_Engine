package com.smartengine.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendTemporaryPasswordEmail(String to, String firstName, String temporaryPassword) {
        if (from == null || from.isBlank()) {
            throw new IllegalStateException("Configuration email manquante: MAIL_USERNAME est vide.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Votre mot de passe temporaire Smart Engine");
            helper.setText(buildTemporaryPasswordHtml(firstName, temporaryPassword), true);
            mailSender.send(message);
        } catch (MessagingException | MailException ex) {
            throw new IllegalStateException("Echec envoi email SMTP. Verifiez MAIL_USERNAME et MAIL_PASSWORD dans backend/.env.", ex);
        }
    }

    private String buildTemporaryPasswordHtml(String firstName, String temporaryPassword) {
        String safeName = firstName == null || firstName.isBlank() ? "Bonjour" : "Bonjour " + firstName;

        return """
            <!doctype html>
            <html>
              <body style="margin:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#eef2f6;padding:36px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="580" cellspacing="0" cellpadding="0" style="width:580px;max-width:92%%;background:#ffffff;border:1px solid #dce5ee;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(23,32,51,.10);">
                        <tr>
                          <td style="background:#172033;padding:30px 34px;color:#ffffff;">
                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td>
                                  <div style="font-size:22px;font-weight:800;letter-spacing:.2px;">Smart Engine</div>
                                  <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#b8c7d6;margin-top:5px;">BPM Platform</div>
                                </td>
                                <td align="right">
                                  <div style="display:inline-block;background:#1f4e79;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Security</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:34px;">
                            <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25;color:#172033;">Mot de passe temporaire</h1>
                            <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4a5568;">%s,</p>
                            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#4a5568;">
                              Voici votre mot de passe temporaire Smart Engine. Utilisez-le sur la page de connexion locale, puis modifiez-le depuis votre profil.
                            </p>
                            <div style="background:#f7fafc;border:1px solid #c5d9ee;border-left:6px solid #1f4e79;border-radius:14px;padding:20px 22px;margin:0 0 24px;">
                              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.6px;color:#1f4e79;font-weight:800;margin-bottom:10px;">A utiliser pour votre prochaine connexion</div>
                              <div style="font-family:Consolas,Monaco,monospace;font-size:28px;font-weight:800;letter-spacing:1.5px;color:#172033;background:#ffffff;border:1px dashed #9bb8d3;border-radius:10px;padding:14px 16px;text-align:center;">%s</div>
                            </div>
                            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:0 0 22px;">
                              <div style="font-size:13px;font-weight:700;color:#9a3412;margin-bottom:4px;">Action requise</div>
                              <div style="font-size:12px;line-height:1.6;color:#9a3412;">Apres connexion, ouvrez Profil &gt; Securite et choisissez un nouveau mot de passe personnel.</div>
                            </div>
                            <p style="margin:0;font-size:12px;line-height:1.6;color:#8898aa;">
                              Aucun lien n'est necessaire pour ce projet local. Ouvrez simplement l'application Smart Engine dans votre navigateur et connectez-vous avec ce mot de passe.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:18px 34px;background:#f8fafc;border-top:1px solid #e5eaf0;font-size:11px;line-height:1.5;color:#8898aa;">
                            Si vous n'etes pas a l'origine de cette demande, contactez l'administrateur et changez votre mot de passe.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """.formatted(safeName, temporaryPassword);
    }
}
