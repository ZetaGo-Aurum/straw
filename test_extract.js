const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ytInitialData_dump.json', 'utf8'));

let subscribers = '';
let likes = '';
let comments = '';

try {
  const videoPrimaryInfo = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(c => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
  const videoSecondaryInfo = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(c => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
  
  // Subscribers
  if (videoSecondaryInfo?.owner?.videoOwnerRenderer?.subscriberCountText?.simpleText) {
      subscribers = videoSecondaryInfo.owner.videoOwnerRenderer.subscriberCountText.simpleText;
  }
  
  // Try to get likes from factoids (modern UI)
  const factoids = data?.engagementPanels?.find(p => p.engagementPanelSectionListRenderer?.targetId === 'engagement-panel-structured-description')
                    ?.engagementPanelSectionListRenderer?.content?.structuredDescriptionContentRenderer?.items?.find(i => i.videoDescriptionHeaderRenderer)?.videoDescriptionHeaderRenderer?.factoid || [];
                    
  const likesFactoid = factoids.find(f => f.factoidRenderer?.accessibilityText?.toLowerCase().includes('like'));
  if (likesFactoid) {
      likes = likesFactoid.factoidRenderer.accessibilityText;
  }
  
  // Try to get comments
  // Usually comments count is harder to find in initialData without scrolling, but let's check engagement panels
  const commentsPanel = data?.engagementPanels?.find(p => p.engagementPanelSectionListRenderer?.panelIdentifier === 'engagement-panel-comments-section');
  if (commentsPanel) {
      comments = commentsPanel.engagementPanelSectionListRenderer.header.engagementPanelTitleHeaderRenderer.contextualInfo?.runs?.[0]?.text || '';
  }
  

} catch (e) {
  console.error(e);
}

console.log('Subscribers:', subscribers);
console.log('Likes:', likes);
console.log('Comments:', comments);
