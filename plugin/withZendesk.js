const {
  withProjectBuildGradle,
  withAppBuildGradle,
  WarningAggregator,
} = require("expo/config-plugins");

const addMavenZendeskRepo = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      WarningAggregator.addWarningAndroid(
        "withProjectBuildGradle",
        `Cannot automatically configure root build.gradle if it's not groovy`
      );
      return config;
    }

    const contents = config.modResults.contents;
    const mavenUrl = "https://zendesk.jfrog.io/artifactory/repo";
    const mavenRepo = `
        maven {
            url "${mavenUrl}"
        }`;

    if (contents.includes(mavenRepo)) {
      return config;
    }

    const allProjectsIndex = contents.indexOf("allprojects {");
    if (allProjectsIndex === -1) {
      WarningAggregator.addWarningAndroid(
        "withProjectBuildGradle",
        `Cannot find allprojects section in root build.gradle`
      );
      return config;
    }

    const repositoriesIndex = contents.indexOf(
      "repositories {",
      allProjectsIndex
    );

    if (repositoriesIndex === -1) {
      WarningAggregator.addWarningAndroid(
        "withProjectBuildGradle",
        `Cannot find repositories section in root build.gradle`
      );
      return config;
    }

    const insertIndex = contents.indexOf("{", repositoriesIndex) + 1;
    config.modResults.contents =
      contents.slice(0, insertIndex) + mavenRepo + contents.slice(insertIndex);

    return config;
  });
};

const addMessagingDependency = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      WarningAggregator.addWarningAndroid(
        "withAppBuildGradle",
        `Cannot automatically configure app/build.gradle if it's not groovy`
      );
      return config;
    }

    const gradleBuild = config.modResults.contents;
    const dependencyName = "zendesk.messaging:messaging-android";
    const dependency = `
    implementation "${dependencyName}:2.26.0"`;

    if (gradleBuild.includes(dependency)) {
      return config;
    }

    const dependenciesIndex = gradleBuild.indexOf("dependencies {");
    if (dependenciesIndex === -1) {
      WarningAggregator.addWarningAndroid(
        "withAppBuildGradle",
        `Cannot find dependencies section in app/build.gradle`
      );
      return config;
    }

    const insertIndex = gradleBuild.indexOf("{", dependenciesIndex) + 1;
    config.modResults.contents =
      gradleBuild.slice(0, insertIndex) +
      dependency +
      gradleBuild.slice(insertIndex);

    return config;
  });
};

module.exports = (config) => {
  config = addMavenZendeskRepo(config);
  return addMessagingDependency(config);
};
