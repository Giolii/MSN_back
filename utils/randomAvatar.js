const randomAvatar = () => {
  const avatars = [
    "https://www.google.https://i.redd.it/67xiprjzuzod1.png/url?sa=i&url=https%3A%2F%2Fwww.reddit.com%2Fr%2FFrutigerAero%2Fcomments%2F1fhfn9e%2Fany_ideas_or_any_similar_products_that_look_like%2F&psig=AOvVaw2lLWchtoh0jzLoOmWm8Bta&ust=1742137115715000&source=images&cd=vfe&opi=89978449&ved=https://preview.redd.it/any-ideas-or-any-similar-products-that-look-like-msn-v0-67xiprjzuzod1.png?auto=webp&s=6cf72404a7a402aa61cda27180ec55384b010947",
    "https://i.redd.it/msn-avatars-of-all-colors-v0-wpe4viwd5uha1.png?width=1024&format=png&auto=webp&s=56ab2a2b048c8841b6ba83b76f756b695d7a1eec",
    "https://content.api.news/v3/images/bin/e2c3480569a51b8009cd99a0d46e3061",
    "https://i0.wp.com/technode.com/wp-content/uploads/2014/08/Messenger.png?fit=256%2C256&ssl=1",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRydlAxO25v4BOe71A-VQQ6ENy_Yz47XRIpRg&s",
    "https://e7.pngegg.com/pngimages/141/816/png-clipart-windows-live-messenger-msn-messenger-microsoft-microsoft-purple-violet-thumbnail.png",
    "https://www.iconninja.com/files/994/728/880/head-account-urban-human-user-msn-profile-person-avatar-people-icon.png",
    "https://banner2.cleanpng.com/20180604/c/avokf6ppr.webp",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkA2mzb6q2GGhc40oOa1QbLO7W7Q48n8RgvAqX6RifOK5Kk55TG8qCAOoDzMyMqsZMKPM&usqp=CAU",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmymF8xcEpo7fj5vDo00vwcG2uDZcizOo3dIo1bXlLl8_S75sQcZ4SOCYKlZQPPhOcxAg&usqp=CAU",
    "https://i.redd.it/msn-avatars-of-all-colors-v0-kdmrknxd5uha1.png?width=1024&format=png&auto=webp&s=7706fc01bdb28170610d79fa7104e3ecf8b40866",
    "https://i.redd.it/msn-avatars-of-all-colors-v0-i19z4jwd5uha1.png?width=1024&format=png&auto=webp&s=3c7433ca602ffbf815e65c46a889bafb85134534",
    "https://i.redd.it/msn-avatars-of-all-colors-v0-wcy83hxd5uha1.png?width=1024&format=png&auto=webp&s=59cfe3a651749f28891130043c01bd6f6b950470",
    "https://i.pinimg.com/564x/c9/81/3c/c9813ccc15ce5804abfcb7940b9568a4.jpg",
    "https://icons.iconarchive.com/icons/media-design/hydropro/512/HP-MSN-icon.png",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRydlAxO25v4BOe71A-VQQ6ENy_Yz47XRIpRg&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2J2GNb0fG4xUOKbV7lamCv7urBCgJ0Dv7Lw&s",
    "https://e1.pngegg.com/pngimages/652/422/png-clipart-msn-crystalgloss-enligne-icon-thumbnail.png",
    "https://i.pinimg.com/564x/e2/72/d5/e272d590ae5b21ded91d86aa2864b731.jpg",
    "https://w7.pngwing.com/pngs/246/924/png-transparent-msn-windows-live-messenger-avatar-blue-heroes-logo.png",
    "https://preview.redd.it/msn-avatars-of-all-colors-v0-h70w8hxd5uha1.png?width=640&crop=smart&auto=webp&s=746b504acc441e9828a6fca05bcd9ad59ac7d210",
    "https://icon-icons.com/icons2/170/PNG/256/msn_user_23243.png",
    "https://images.freeimages.com/fic/images/icons/1733/msn_messenger_aqua/256/msn_invisible.png?h=350",
    "https://cdn3d.iconscout.com/3d/premium/thumb/user-profile-icon-3d-download-in-png-blend-fbx-gltf-file-formats--avatar-account-login-interface-pack-essential-icons-8512567.png?f=webp",
    "https://wink.messengergeek.com/uploads/default/original/3X/1/1/11471bbe5791b4486fe6d47dfa406fdeaa61a845.png",
    "https://art.ngfiles.com/images/5317000/5317433_337367_clawstoe_msm-avatar.859dcb8c730ac7961cd580d341480c61.webp?f1703784973",
    "https://banner2.cleanpng.com/20180702/kzs/aaw2hzkxa.webp",
  ];

  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
};

module.exports = randomAvatar;
