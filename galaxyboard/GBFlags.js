//
//  flags.js
//  Here you will find the definitions of binary flags used to control access/permissions/states
//  This list should also be used in our frontend.
//  outcommented flags = not used anylonger or implementation missing :)
//

//
//  General flags related to our board 
//  table.board_config -> boardflags
//
exports.dfpab_boardclosed   =   1<<0;    //  Gesamte Board ist geschlossen
exports.dfpab_noregistration=   1<<1;    //  Keine Registrierung erlauben
exports.dfpab_approvereg    =   1<<2;    //  Registrierung muss manuell freigeschaltet werden
exports.dfpab_usr_avatar    =   1<<30;   //  darf eigenen avatar hochladen

//
//  Topicflags - State of a topic
//  table.topics -> flags
//
exports.dft_closed      =   1<<0;        //  Topic geschlossen
exports.dft_mod_closed  =   1<<1;        //  Topic geschlossen durch admin (kann dann auch nur durch admin geöffnet werden)
exports.dft_unapproved  =   1<<2;        //  Topic nicht freigegeben
exports.dft_pinned      =   1<<3;        //  Topic festgepinnt

//
//  Userflags - Configuration of an account
//  table.users -> flags
//
exports.dfu_no_pn       =   1<<0;        //  will keine PN empfangen
exports.dfu_no_sigs     =   1<<1;        //  will keine signaturen sehen
exports.dfu_membermail  =   1<<2;        //  Jeder kann mir emails schicken
//#dfu_adminmail   =   1<<3;        //  obs. Admins können mir Mails schicken (Newsletter)
exports.dfu_openpm      =   1<<4;        //  Popup öffnen wenn neue Nachrichten
//#dfu_summertime  =   1<<5;        //  obs. Sommerzeit aktiviert +0100 ?
//#dfu_bbcode_sig  =   1<<6;        //  obs. bbcodes in signatur ABSCHALTEN
//#dfu_smilies_sig =   1<<7;        //  obs. ABSCHALTEN
//#dfu_links_sig   =   1<<8;        //  obs. ABSCHALTEN

//  ToDo: Prüfe: Flags ab Bit16 sind nicht editierbar? Besser eigene 16Bit verwenden für Admin>User Settings
exports.dfu_unapproved  =   1<<27;      //  User muss noch freigegeben werden.
exports.dfu_invalid     =   1<<28;      //  EMail-Adresse des Users noch nicht geprüft!
exports.dfu_ownavatar   =   1<<29;      //  eigener avatar hochgeladen
exports.dfu_premium     =   1<<30;      //  premiumuser
exports.dfu_superadmin  =   1<<31;      //  ist ein superadmin

//
//  Boardflags - A board is a collection of topics. E.g. board "internal" could have topics of marketing, bugs etc.
//  table.board_config -> boardflags
//
exports.dfbf_bbcode_board   =   1<<0;    //  Ob headline/Beschreibung bbcode enthalten darf
exports.dfbf_smilies_board  =   1<<1;    //
exports.dfbf_links_board    =   1<<2;    //
exports.dfbf_bbcode_rule    =   1<<3;    //  Ob die Regeln bbcode enthalten dürfen
exports.dfbf_smilies_rule   =   1<<4;    //
exports.dfbf_links_rule     =   1<<5;    //
exports.dfbf_showsubboards  =   1<<6;    //  Ob untergeordnete Boards angezeigt werden dürfen
exports.dfbf_hideboard      =   1<<7;    //  Versteckt das Forum
exports.dfbf_closed         =   1<<8;    //  Bereich abgeschlossen (nicht editierbar)
exports.dfbf_chooseprefix   =   1<<9;    //  Sofern Prefixe vorhanden *muss* eine Auswahl getroffen werden
exports.dfbf_nonews         =   1<<10;   //  Beiträge nicht in News erwähnen
exports.dfbf_dynmenu        =   1<<11;   //  dynamische menüs!

//
//  Userpermissions inside board
//  table.board_acl -> bflags
//  Post related                          
exports.dfbp_postanounce    =   1<<0;    //  Can post announcements
exports.dfbp_useicons       =   1<<1;    //  Can use topic/post icons
exports.dfbp_show           =   1<<2;    //  Can see forum
exports.dfbp_createtopic    =   1<<3;    //  Can start new topics
exports.dfbp_readboard      =   1<<4;    //  Can read forum
exports.dfbp_reply          =   1<<5;    //  Can reply to topics
exports.dfbp_poststicky     =   1<<6;    //  Can post stickies
//  Content related                      
exports.dfbp_attachfile     =   1<<16;   //  Can attach files
exports.dfbp_usebbcode      =   1<<17;   //  Can post BBCode
exports.dfbp_downloadfile   =   1<<18;   //  Can download files
exports.dfbp_postflash      =   1<<19;   //  Can post Flash
exports.dfbp_postimages     =   1<<20;   //  Can post images
exports.dfbp_signatures     =   1<<21;   //  Can use signatures
exports.dfbp_smilies        =   1<<22;   //  Can post smilies

//
//  Extended Flags
//  table.board_groups -> eflags
//  Actions
//#dfbp_bumptopic      =   1<<0;   //  Can bump topics    (create?)    
exports.dfbp_deleteownpost  =   1<<1;   //  Can delete own posts
exports.dfbp_editownpost    =   1<<2;   //  Can edit own posts
//#dfbp_emailtopic     =   1<<3;   //  Can e-mail topics
//#dfbp_printtopic     =   1<<4;   //  Can print topics
exports.dfbp_reportpost     =   1<<5;   //  Can report posts
//#dfbp_subscribe      =   1<<6;   //  Can subscribe forum
exports.dfbp_closeowntopic   =   1<<7;   //  Eigenes Topic schliessen
//#  Misc                          
//#dfbp_ignoreflood    =   1<<16;   //  Can ignore flood limit
//#dfbp_noapproval     =   1<<17;   //  Can post without approval
exports.dfbp_incpostcounter =   1<<18;   //  Increment post counter (Please note that this setting only affects new posts.)
//#dfbp_search         =   1<<19;   //  Can search the forum

//#  Polls                        
//#dfbp_createpolls    =   1<<24;   //  Can create polls
//#dfbp_votepoll       =   1<<25;   //  Can vote in polls
//#dfbp_changevote     =   1<<26;   //  Can change existing vote
//#dfbp_votetopic      =   1<<27;   //  Topic bewerten

//
//  Moderator flags
//  table.mods -> flags
//  
exports.dfmod_approvepost   =   1<<0;    //  Kann Beiträge freigeben
exports.dfmod_setauthor     =   1<<1;    //  Kann Autor eines Beitrags ändern
exports.dfmod_deletepost    =   1<<2;    //  Kann Beiträge löschen
exports.dfmod_editpost      =   1<<3;    //  Kann Beiträge ändern
exports.dfmod_closereports  =   1<<4;    //  Kann Meldungen schließen und löschen
exports.dfmod_hidepost      =   1<<5;    //  Kann einen Beitrag "verstecken"
exports.dfmod_replypost     =   1<<6;    //  Kann auf Beitrag antworten auch wenn thema geschlossen wurde.
//  
exports.dfmod_managebans    =   1<<8;    //  Kann Sperren verwalten
exports.dfmod_postdetails   =   1<<9;    //  Kann Beitrags-Details ansehen
exports.dfmod_createbans    =   1<<10;   //  Kann Verwarnungen aussprechen
//  Topic related
exports.dfmod_closethread   =   1<<16;   //  Kann Themen sperren
exports.dfmod_jointhreads   =   1<<17;   //  Kann Themen zusammenführen
exports.dfmod_movethread    =   1<<18;   //  Kann Themen verschieben
exports.dfmod_splitthread   =   1<<19;   //  Kann Themen teilen
exports.dfmod_deletethread  =   1<<20;   //  Kann Themen löschen
exports.dfmod_editthread    =   1<<21;   //  Kann Themen editieren
exports.dfmod_createtopic   =   1<<22;   //  Kann Themen erstellen im geschlossenen Forum

//
//  Post related
//  table.posts -> postflags
//
exports.dfpost_needapproval =   1<<0;    //  Beitrag benötigt Freigabe (ggf. auch Topic mit freigeben falls themenstarter?)
exports.dfpost_hide         =   1<<1;    //  Beitrag wurde versteckt
exports.dfpost_reported     =   1<<2;    //  Beitrag wurde gemeldet (darf nicht mehr geändert werden)

//
//  Message flags
//  table.messages -> flag
//
exports.dfmsg_read          =   1<<0;
exports.dfmsg_replied       =   1<<1;
exports.dfmsg_jsondata      =   1<<3;
